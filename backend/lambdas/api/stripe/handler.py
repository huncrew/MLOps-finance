"""
Stripe checkout Lambda handler.
Migrated from backend/functions/stripe.ts (checkout functionality)
"""
import json
import time
from typing import Dict, Any, Optional
from common.logging import get_logger, log_lambda_event, log_lambda_response
from common.response import (
    success_response, error_response, cors_preflight_response,
    parse_json_body, validation_error_response, internal_server_error_response
)
from common.env import config
from common.models import StripeCheckoutRequest, validate_user_data
from common.exceptions import ValidationError, ExternalServiceError

logger = get_logger(__name__)

# Import Stripe (will be available when deployed with requirements.txt)
try:
    import stripe
except ImportError:
    logger.warning("Stripe library not available - using mock for development")
    stripe = None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Stripe checkout Lambda handler.
    
    Creates Stripe checkout sessions for subscription payments.
    
    Args:
        event: API Gateway HTTP API event
        context: Lambda context
        
    Returns:
        API Gateway HTTP API response
    """
    start_time = time.time()
    log_lambda_event(logger, event, context)
    
    try:
        # Handle CORS preflight
        http_method = event.get('requestContext', {}).get('http', {}).get('method')
        if http_method == 'OPTIONS':
            return cors_preflight_response()
        
        # Parse request body
        body = parse_json_body(event)
        if body is None:
            return validation_error_response("Invalid JSON in request body")
        
        # Validate required fields
        price_id = body.get('priceId')
        if not price_id:
            return validation_error_response("Price ID is required", "priceId")
        
        user_id = body.get('userId', 'anonymous')
        
        logger.info(f"Creating checkout session for price: {price_id}, user: {user_id}")
        
        # Create checkout session
        session_data = create_checkout_session(price_id, user_id, event)
        
        response = success_response({
            'clientSecret': session_data['client_secret'],
            'sessionId': session_data['session_id']
        })
        
        # Log successful response
        duration_ms = (time.time() - start_time) * 1000
        log_lambda_response(logger, response, context, duration_ms)
        
        return response
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}")
        return validation_error_response(e.message)
        
    except ExternalServiceError as e:
        logger.error(f"Stripe API error: {e.message}")
        return error_response("Failed to create checkout session", 502, "STRIPE_ERROR")
        
    except Exception as e:
        logger.error(f"Unexpected error in stripe checkout handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Failed to create checkout session")


def create_checkout_session(price_id: str, user_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create Stripe checkout session.
    
    Args:
        price_id: Stripe price ID
        user_id: User ID for metadata
        event: API Gateway event for origin detection
        
    Returns:
        Dictionary with client_secret and session_id
    """
    # Get Stripe secret key
    stripe_secret_key = config.get_stripe_secret_key()
    if not stripe_secret_key or stripe_secret_key.startswith('placeholder'):
        logger.warning("Stripe secret key not configured - returning mock data")
        return {
            'client_secret': 'pi_mock_client_secret_for_development',
            'session_id': 'cs_mock_session_id_for_development'
        }
    
    if not stripe:
        raise ExternalServiceError("Stripe library not available")
    
    # Configure Stripe
    stripe.api_key = stripe_secret_key
    
    try:
        # Determine return URL from request origin
        origin = (event.get('headers', {}).get('origin') or 
                 event.get('headers', {}).get('Origin') or 
                 'http://localhost:3000')
        
        return_url = f"{origin}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            ui_mode='embedded',
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            return_url=return_url,
            metadata={
                'userId': user_id
            }
        )
        
        logger.info(f"Created Stripe checkout session: {session.id}")
        
        return {
            'client_secret': session.client_secret,
            'session_id': session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe API error: {str(e)}")
        raise ExternalServiceError(f"Stripe API error: {str(e)}", "stripe")
    
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise ExternalServiceError(f"Failed to create checkout session: {str(e)}", "stripe")


# For testing purposes
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        "requestContext": {
            "http": {
                "method": "POST",
                "path": "/stripe/checkout"
            }
        },
        "headers": {
            "origin": "http://localhost:3000"
        },
        "body": json.dumps({
            "priceId": "price_test_123",
            "userId": "user_test_123"
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