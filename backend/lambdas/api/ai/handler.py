"""
AI generation Lambda handler.
Migrated from backend/functions/ai.ts (generation functionality)
"""
import json
import time
import uuid
from typing import Dict, Any, Optional
from common.logging import get_logger, log_lambda_event, log_lambda_response
from common.response import (
    success_response, error_response, cors_preflight_response,
    parse_json_body, validation_error_response, internal_server_error_response,
    subscription_error_response
)
from common.env import config
from common.dynamodb import dynamodb_service
from common.models import AIGenerationRequest, validate_ai_request, AIModel
from common.exceptions import (
    ValidationError, DatabaseError, SubscriptionError, ExternalServiceError
)

logger = get_logger(__name__)

# Import AWS Bedrock (will be available when deployed)
try:
    import boto3
    from botocore.exceptions import ClientError
    bedrock_client = boto3.client('bedrock-runtime', region_name=config.aws_region)
except ImportError:
    logger.warning("AWS SDK not available - using mock for development")
    bedrock_client = None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AI generation Lambda handler.
    
    Processes AI generation requests using AWS Bedrock.
    
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
        
        # Validate AI request
        validation_errors = validate_ai_request(body)
        if validation_errors:
            error_messages = [f"{field}: {message}" for field, message in validation_errors.items()]
            return validation_error_response(f"Validation failed: {', '.join(error_messages)}")
        
        # Create AI request object
        ai_request = AIGenerationRequest.from_dict(body)
        
        logger.info(f"Processing AI generation request for user: {ai_request.user_id}")
        
        # Check user subscription if user ID provided
        if ai_request.user_id:
            if not check_user_subscription(ai_request.user_id):
                return subscription_error_response("Active subscription required for AI features")
        
        # Generate AI response
        ai_response = generate_ai_response(ai_request)
        
        # Store AI session if user ID provided
        if ai_request.user_id:
            store_ai_session(ai_request, ai_response, context.aws_request_id)
        
        response = success_response({
            'response': ai_response['response'],
            'model': ai_response['model'],
            'tokens': ai_response['tokens'],
            'requestId': context.aws_request_id
        })
        
        # Log successful response
        duration_ms = (time.time() - start_time) * 1000
        log_lambda_response(logger, response, context, duration_ms)
        
        return response
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}")
        return validation_error_response(e.message)
        
    except SubscriptionError as e:
        logger.warning(f"Subscription error: {e.message}")
        return subscription_error_response(e.message)
        
    except ExternalServiceError as e:
        logger.error(f"AI service error: {e.message}")
        return error_response("AI processing failed", 502, "AI_SERVICE_ERROR")
        
    except DatabaseError as e:
        logger.error(f"Database error: {e.message}")
        return internal_server_error_response("Database operation failed")
        
    except Exception as e:
        logger.error(f"Unexpected error in AI handler: {str(e)}", exc_info=True)
        return internal_server_error_response("AI processing failed")


def check_user_subscription(user_id: str) -> bool:
    """
    Check if user has an active subscription.
    
    Args:
        user_id: User ID
        
    Returns:
        True if user has active subscription
    """
    try:
        user = dynamodb_service.get_user(user_id)
        if not user:
            logger.warning(f"User not found for subscription check: {user_id}")
            return False
        
        has_active = user.get('subscriptionStatus') == 'active'
        logger.info(f"Subscription check for user {user_id}: {has_active}")
        return has_active
        
    except Exception as e:
        logger.error(f"Error checking subscription for user {user_id}: {str(e)}")
        return False


def generate_ai_response(ai_request: AIGenerationRequest) -> Dict[str, Any]:
    """
    Generate AI response using AWS Bedrock.
    
    Args:
        ai_request: AI generation request
        
    Returns:
        Dictionary with AI response data
    """
    if not bedrock_client:
        # Mock response for development
        logger.warning("Bedrock client not available - returning mock response")
        return {
            'response': f"Mock AI response to: {ai_request.prompt[:50]}...",
            'model': ai_request.model,
            'tokens': 42
        }
    
    try:
        # Prepare request body for Claude
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": ai_request.max_tokens,
            "temperature": ai_request.temperature,
            "messages": [
                {
                    "role": "user",
                    "content": ai_request.prompt
                }
            ]
        }
        
        logger.info(f"Calling Bedrock with model: {ai_request.model}")
        
        # Call Bedrock
        response = bedrock_client.invoke_model(
            modelId=ai_request.model,
            body=json.dumps(request_body),
            contentType='application/json',
            accept='application/json'
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        
        # Extract response text and token usage
        ai_response_text = response_body.get('content', [{}])[0].get('text', 'No response generated')
        tokens_used = response_body.get('usage', {}).get('output_tokens', 0)
        
        logger.info(f"AI generation completed. Tokens used: {tokens_used}")
        
        return {
            'response': ai_response_text,
            'model': ai_request.model,
            'tokens': tokens_used
        }
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', str(e))
        logger.error(f"Bedrock API error [{error_code}]: {error_message}")
        raise ExternalServiceError(f"Bedrock API error: {error_message}", "bedrock")
        
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        raise ExternalServiceError(f"AI generation failed: {str(e)}", "bedrock")


def store_ai_session(ai_request: AIGenerationRequest, ai_response: Dict[str, Any], 
                    request_id: str) -> None:
    """
    Store AI session in database.
    
    Args:
        ai_request: Original AI request
        ai_response: AI response data
        request_id: Lambda request ID
    """
    try:
        session_id = f"{int(time.time())}-{str(uuid.uuid4())[:8]}"
        
        session_data = {
            'id': session_id,
            'userId': ai_request.user_id,
            'prompt': ai_request.prompt,
            'response': ai_response['response'],
            'model': ai_response['model'],
            'tokens': ai_response['tokens']
        }
        
        dynamodb_service.store_ai_session(session_data)
        logger.info(f"Stored AI session: {session_id}")
        
    except Exception as e:
        # Don't fail the request if session storage fails
        logger.error(f"Error storing AI session: {str(e)}")


# For testing purposes
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        "requestContext": {
            "http": {
                "method": "POST",
                "path": "/ai/generate"
            }
        },
        "body": json.dumps({
            "prompt": "Explain quantum computing in simple terms",
            "model": AIModel.CLAUDE_HAIKU.value,
            "maxTokens": 500,
            "temperature": 0.7,
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