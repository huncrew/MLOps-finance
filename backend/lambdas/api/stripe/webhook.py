"""
Stripe webhook Lambda handler.
Migrated from backend/functions/stripe.ts (webhook functionality)
"""
import json
import time
from typing import Dict, Any, Optional
from common.logging import get_logger, log_lambda_event, log_lambda_response
from common.response import (
    success_response, error_response, cors_preflight_response,
    get_header, validation_error_response, internal_server_error_response
)
from common.env import config
from common.dynamodb import dynamodb_service
from common.exceptions import ValidationError, ExternalServiceError, DatabaseError

logger = get_logger(__name__)

# Import Stripe (will be available when deployed with requirements.txt)
try:
    import stripe
except ImportError:
    logger.warning("Stripe library not available - using mock for development")
    stripe = None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Stripe webhook Lambda handler.
    
    Processes Stripe webhook events for subscription management.
    
    Args:
        event: API Gateway HTTP API event
        context: Lambda context
        
    Returns:
        API Gateway HTTP API response
    """
    start_time = time.time()
    log_lambda_event(logger, event, context)
    
    try:
        # Handle CORS preflight (though webhooks shouldn't need this)
        http_method = event.get('requestContext', {}).get('http', {}).get('method')
        if http_method == 'OPTIONS':
            return cors_preflight_response()
        
        # Get Stripe signature
        stripe_signature = (get_header(event, 'stripe-signature') or 
                          get_header(event, 'Stripe-Signature'))
        
        if not stripe_signature:
            logger.warning("Missing Stripe signature header")
            return error_response("Missing signature", 400, "MISSING_SIGNATURE")
        
        # Get webhook secret
        webhook_secret = config.get_stripe_webhook_secret()
        if not webhook_secret or webhook_secret.startswith('placeholder'):
            logger.warning("Stripe webhook secret not configured")
            return error_response("Webhook not configured", 400, "WEBHOOK_NOT_CONFIGURED")
        
        # Get raw body
        raw_body = event.get('body', '')
        if not raw_body:
            return validation_error_response("Empty request body")
        
        logger.info("Processing Stripe webhook event")
        
        # Verify and parse webhook event
        stripe_event = verify_webhook_signature(raw_body, stripe_signature, webhook_secret)
        
        # Process the event
        process_stripe_event(stripe_event)
        
        response = success_response({'received': True})
        
        # Log successful response
        duration_ms = (time.time() - start_time) * 1000
        log_lambda_response(logger, response, context, duration_ms)
        
        return response
        
    except ValidationError as e:
        logger.warning(f"Webhook validation error: {e.message}")
        return error_response(e.message, 400, "WEBHOOK_VALIDATION_ERROR")
        
    except ExternalServiceError as e:
        logger.error(f"Stripe webhook error: {e.message}")
        return error_response("Webhook processing failed", 400, "WEBHOOK_ERROR")
        
    except DatabaseError as e:
        logger.error(f"Database error processing webhook: {e.message}")
        return internal_server_error_response("Database operation failed")
        
    except Exception as e:
        logger.error(f"Unexpected error in stripe webhook handler: {str(e)}", exc_info=True)
        return error_response("Webhook handler failed", 400, "WEBHOOK_HANDLER_ERROR")


def verify_webhook_signature(raw_body: str, signature: str, webhook_secret: str) -> Dict[str, Any]:
    """
    Verify Stripe webhook signature and parse event.
    
    Args:
        raw_body: Raw request body
        signature: Stripe signature header
        webhook_secret: Webhook endpoint secret
        
    Returns:
        Parsed Stripe event
    """
    if not stripe:
        # Mock for development
        logger.warning("Stripe library not available - using mock event")
        return {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_mock_session',
                    'metadata': {'userId': 'mock_user'},
                    'subscription': 'sub_mock_subscription'
                }
            }
        }
    
    try:
        # Verify webhook signature
        stripe_event = stripe.Webhook.construct_event(
            raw_body, signature, webhook_secret
        )
        
        logger.info(f"Verified Stripe webhook event: {stripe_event['type']}")
        return stripe_event
        
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise ValidationError("Invalid payload")
        
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise ValidationError("Invalid signature")
        
    except Exception as e:
        logger.error(f"Error verifying webhook: {str(e)}")
        raise ExternalServiceError(f"Webhook verification failed: {str(e)}", "stripe")


def process_stripe_event(stripe_event: Dict[str, Any]) -> None:
    """
    Process Stripe webhook event.
    
    Args:
        stripe_event: Verified Stripe event
    """
    event_type = stripe_event.get('type')
    logger.info(f"Processing Stripe event: {event_type}")
    
    try:
        if event_type == 'checkout.session.completed':
            handle_checkout_completed(stripe_event['data']['object'])
        elif event_type in ['customer.subscription.updated', 'customer.subscription.deleted']:
            handle_subscription_change(stripe_event['data']['object'])
        else:
            logger.info(f"Unhandled event type: {event_type}")
    
    except Exception as e:
        logger.error(f"Error processing {event_type} event: {str(e)}")
        raise DatabaseError(f"Failed to process {event_type} event")


def handle_checkout_completed(session: Dict[str, Any]) -> None:
    """
    Handle checkout.session.completed event.
    
    Args:
        session: Stripe checkout session object
    """
    try:
        user_id = session.get('metadata', {}).get('userId')
        if not user_id or user_id == 'anonymous':
            logger.error("No user ID found in session metadata")
            return
        
        logger.info(f"Processing checkout completion for user: {user_id}")
        
        # Update user subscription status
        dynamodb_service.update_user(user_id, {
            'subscriptionStatus': 'active'
        })
        
        # Create subscription record if subscription ID is available
        subscription_id = session.get('subscription')
        if subscription_id:
            if stripe:
                # Retrieve full subscription details from Stripe
                subscription = stripe.Subscription.retrieve(subscription_id)
                
                subscription_data = {
                    'id': subscription.id,
                    'userId': user_id,
                    'stripeSubscriptionId': subscription.id,
                    'status': subscription.status,
                    'currentPeriodStart': format_timestamp(subscription.current_period_start),
                    'currentPeriodEnd': format_timestamp(subscription.current_period_end),
                    'planId': subscription.items.data[0].price.id if subscription.items.data else 'unknown'
                }
            else:
                # Mock data for development
                subscription_data = {
                    'id': subscription_id,
                    'userId': user_id,
                    'stripeSubscriptionId': subscription_id,
                    'status': 'active',
                    'currentPeriodStart': '2024-01-01T00:00:00Z',
                    'currentPeriodEnd': '2024-02-01T00:00:00Z',
                    'planId': 'mock_plan_id'
                }
            
            dynamodb_service.create_subscription(subscription_data)
            logger.info(f"Created subscription record: {subscription_id}")
        
        logger.info(f"Successfully processed checkout completion for user: {user_id}")
        
    except Exception as e:
        logger.error(f"Error handling checkout completed: {str(e)}")
        raise


def handle_subscription_change(subscription: Dict[str, Any]) -> None:
    """
    Handle subscription update/deletion events.
    
    Args:
        subscription: Stripe subscription object
    """
    try:
        # Try to find user ID from subscription metadata
        user_id = subscription.get('metadata', {}).get('userId')
        if not user_id:
            logger.error("No user ID found in subscription metadata")
            return
        
        subscription_status = 'active' if subscription.get('status') == 'active' else 'inactive'
        
        logger.info(f"Updating subscription status for user {user_id}: {subscription_status}")
        
        # Update user subscription status
        dynamodb_service.update_user(user_id, {
            'subscriptionStatus': subscription_status
        })
        
        logger.info(f"Successfully updated subscription status for user: {user_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription change: {str(e)}")
        raise


def format_timestamp(timestamp: int) -> str:
    """
    Format Unix timestamp to ISO string.
    
    Args:
        timestamp: Unix timestamp
        
    Returns:
        ISO formatted datetime string
    """
    from datetime import datetime
    return datetime.utcfromtimestamp(timestamp).isoformat() + 'Z'


# For testing purposes
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        "requestContext": {
            "http": {
                "method": "POST",
                "path": "/stripe/webhook"
            }
        },
        "headers": {
            "stripe-signature": "t=1234567890,v1=mock_signature"
        },
        "body": json.dumps({
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_session",
                    "metadata": {"userId": "test_user_123"},
                    "subscription": "sub_test_subscription"
                }
            }
        })
    }
    
    class MockContext:
        aws_request_id = "test-request-id"
        function_name = "test-function"
        function_version = "1"
        
        def get_remaining_time_in_millis(self):
            return 30000
    
    result = handler(test_event, MockContext())
    print(json.dumps(result, indent=2))