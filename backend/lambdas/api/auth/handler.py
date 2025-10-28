"""
Authentication Lambda handler.
Migrated from backend/functions/auth.ts
"""
import json
import time
from typing import Dict, Any
from common.logging import get_logger, log_lambda_event, log_lambda_response
from common.response import (
    success_response, error_response, cors_preflight_response,
    parse_json_body, validation_error_response, internal_server_error_response
)
from common.dynamodb import dynamodb_service
from common.models import User, validate_user_data
from common.exceptions import ValidationError, DatabaseError, NotFoundError

logger = get_logger(__name__)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Authentication Lambda handler.
    
    Handles user session management operations:
    - getUser: Retrieve user by ID
    - createUser: Create new user
    
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
        
        # Get action from request
        action = body.get('action')
        if not action:
            return validation_error_response("Action is required", "action")
        
        # Route to appropriate handler
        if action == 'getUser':
            response = handle_get_user(body)
        elif action == 'createUser':
            response = handle_create_user(body)
        else:
            return validation_error_response(f"Invalid action: {action}", "action")
        
        # Log successful response
        duration_ms = (time.time() - start_time) * 1000
        log_lambda_response(logger, response, context, duration_ms)
        
        return response
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}", extra={'field': getattr(e, 'field', None)})
        return validation_error_response(e.message, getattr(e, 'field', None))
        
    except NotFoundError as e:
        logger.warning(f"Resource not found: {e.message}")
        return error_response(e.message, 404, "NOT_FOUND")
        
    except DatabaseError as e:
        logger.error(f"Database error: {e.message}")
        return internal_server_error_response("Database operation failed")
        
    except Exception as e:
        logger.error(f"Unexpected error in auth handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")


def handle_get_user(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle getUser action.
    
    Args:
        body: Request body
        
    Returns:
        API response
    """
    user_id = body.get('userId')
    if not user_id:
        raise ValidationError("User ID is required", "userId")
    
    logger.info(f"Getting user: {user_id}")
    
    # Get user from database
    user_data = dynamodb_service.get_user(user_id)
    if not user_data:
        raise NotFoundError(f"User not found: {user_id}")
    
    logger.info(f"Successfully retrieved user: {user_id}")
    return success_response(user_data)


def handle_create_user(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle createUser action.
    
    Args:
        body: Request body
        
    Returns:
        API response
    """
    user_data = body.get('userData')
    if not user_data:
        raise ValidationError("User data is required", "userData")
    
    # Validate user data
    validation_errors = validate_user_data(user_data)
    if validation_errors:
        error_messages = [f"{field}: {message}" for field, message in validation_errors.items()]
        raise ValidationError(f"Validation failed: {', '.join(error_messages)}")
    
    user_id = user_data.get('id')
    logger.info(f"Creating user: {user_id}")
    
    try:
        # Check if user already exists
        existing_user = dynamodb_service.get_user(user_id)
        if existing_user:
            logger.warning(f"User already exists: {user_id}")
            return success_response(existing_user)
        
        # Create new user
        created_user = dynamodb_service.create_user(user_data)
        
        logger.info(f"Successfully created user: {user_id}")
        return success_response(created_user, 201)
        
    except Exception as e:
        logger.error(f"Error creating user {user_id}: {str(e)}")
        raise DatabaseError(f"Failed to create user: {str(e)}")


# For testing purposes
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        "requestContext": {
            "http": {
                "method": "POST",
                "path": "/auth/session"
            }
        },
        "body": json.dumps({
            "action": "getUser",
            "userId": "test-user-123"
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