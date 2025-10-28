"""
Subscription status Lambda handler.
Migrated from backend/functions/subscription.ts
"""
import json
import time
from typing import Dict, Any, Optional
from common.logging import get_logger, log_lambda_event, log_lambda_response
from common.response import (
    success_response, error_response, cors_preflight_response,
    get_path_parameter, get_query_parameter, validation_error_response,
    internal_server_error_response, not_found_error_response
)
from common.env import config
from common.dynamodb import dynamodb_service
from common.exceptions import ValidationError, DatabaseError, NotFoundError

logger = get_logger(__name__)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Subscription status Lambda handler.
    
    Retrieves subscription status and details for a user.
    
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
        
        # Get user ID from path or query parameters
        user_id = (get_path_parameter(event, 'userId') or 
                  get_query_parameter(event, 'userId'))
        
        if not user_id:
            return validation_error_response("User ID is required", "userId")
        
        logger.info(f"Getting subscription status for user: {user_id}")
        
        # Log environment check for debugging
        logger.debug("Environment check", extra={
            'NODE_ENV': config.stage,
            'DATABASE_TABLE_NAME': config.get_database_table_name(),
            'AWS_REGION': config.aws_region,
            'userId': user_id
        })
        
        # Check if database is configured
        if not config.get_database_table_name():
            logger.warning("DATABASE_TABLE_NAME not found, returning mock data")
            response = success_response({
                'subscription': None,
                'subscriptionStatus': 'inactive',
                'hasActiveSubscription': False
            })
        else:
            # Get subscription data
            subscription_data = get_subscription_status(user_id)
            response = success_response(subscription_data)
        
        # Log successful response
        duration_ms = (time.time() - start_time) * 1000
        log_lambda_response(logger, response, context, duration_ms)
        
        return response
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}")
        return validation_error_response(e.message)
        
    except NotFoundError as e:
        logger.warning(f"Resource not found: {e.message}")
        return not_found_error_response(e.message)
        
    except DatabaseError as e:
        logger.error(f"Database error: {e.message}")
        return internal_server_error_response("Database operation failed")
        
    except Exception as e:
        logger.error(f"Unexpected error in subscription handler: {str(e)}", exc_info=True)
        
        # Include debug info in development
        debug_info = None
        if config.stage == 'dev':
            debug_info = str(e)
        
        return error_response(
            "Internal server error",
            500,
            "INTERNAL_ERROR",
            {'debug': debug_info} if debug_info else None
        )


def get_subscription_status(user_id: str) -> Dict[str, Any]:
    """
    Get subscription status for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        Dictionary with subscription data
    """
    try:
        # Get subscription details
        subscription = dynamodb_service.get_subscription(user_id)
        
        # Get user details for subscription status
        user = dynamodb_service.get_user(user_id)
        
        # Determine subscription status
        subscription_status = 'inactive'
        has_active_subscription = False
        
        if user:
            subscription_status = user.get('subscriptionStatus', 'inactive')
            has_active_subscription = subscription_status == 'active'
        
        # If no user found, create a basic response
        if not user:
            logger.warning(f"User not found: {user_id}")
            # Don't create user automatically, just return inactive status
            subscription_status = 'inactive'
            has_active_subscription = False
        
        result = {
            'subscription': subscription,
            'subscriptionStatus': subscription_status,
            'hasActiveSubscription': has_active_subscription
        }
        
        logger.info(f"Retrieved subscription status for user {user_id}: {subscription_status}")
        return result
        
    except Exception as e:
        logger.error(f"Error getting subscription status for user {user_id}: {str(e)}")
        raise DatabaseError(f"Failed to retrieve subscription status: {str(e)}")


def create_mock_subscription_data(user_id: str) -> Dict[str, Any]:
    """
    Create mock subscription data for development/testing.
    
    Args:
        user_id: User ID
        
    Returns:
        Mock subscription data
    """
    return {
        'subscription': {
            'id': f'sub_mock_{user_id}',
            'userId': user_id,
            'stripeSubscriptionId': f'sub_stripe_mock_{user_id}',
            'status': 'active',
            'planId': 'price_mock_plan',
            'currentPeriodStart': '2024-01-01T00:00:00Z',
            'currentPeriodEnd': '2024-02-01T00:00:00Z',
            'createdAt': '2024-01-01T00:00:00Z',
            'updatedAt': '2024-01-01T00:00:00Z'
        },
        'subscriptionStatus': 'active',
        'hasActiveSubscription': True
    }


# For testing purposes
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        "requestContext": {
            "http": {
                "method": "GET",
                "path": "/subscription/status"
            }
        },
        "queryStringParameters": {
            "userId": "test-user-123"
        }
    }
    
    class MockContext:
        aws_request_id = "test-request-id"
        function_name = "test-function"
        function_version = "1"
        
        def get_remaining_time_in_millis(self):
            return 30000
    
    result = handler(test_event, MockContext())
    print(json.dumps(result, indent=2))