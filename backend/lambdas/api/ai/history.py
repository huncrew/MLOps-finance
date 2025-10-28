"""
AI history Lambda handler.
Migrated from backend/functions/ai.ts (history functionality)
"""
import json
import time
from typing import Dict, Any, Optional, List
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
    AI history Lambda handler.
    
    Retrieves AI session history for a user.
    
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
        
        # Get optional limit parameter
        limit_str = get_query_parameter(event, 'limit')
        limit = 50  # Default limit
        
        if limit_str:
            try:
                limit = int(limit_str)
                if limit < 1 or limit > 100:
                    return validation_error_response("Limit must be between 1 and 100", "limit")
            except ValueError:
                return validation_error_response("Invalid limit parameter", "limit")
        
        logger.info(f"Getting AI history for user: {user_id}, limit: {limit}")
        
        # Get AI history
        sessions = get_ai_history(user_id, limit)
        
        response = success_response(sessions)
        
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
        logger.error(f"Unexpected error in AI history handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Failed to retrieve AI history")


def get_ai_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get AI session history for a user.
    
    Args:
        user_id: User ID
        limit: Maximum number of sessions to return
        
    Returns:
        List of AI sessions
    """
    try:
        # Check if database is configured
        if not config.get_database_table_name():
            logger.warning("Database not configured - returning mock data")
            return create_mock_ai_history(user_id, limit)
        
        # Get AI sessions from database
        sessions = dynamodb_service.get_ai_history(user_id, limit)
        
        logger.info(f"Retrieved {len(sessions)} AI sessions for user: {user_id}")
        return sessions
        
    except Exception as e:
        logger.error(f"Error getting AI history for user {user_id}: {str(e)}")
        raise DatabaseError(f"Failed to retrieve AI history: {str(e)}")


def create_mock_ai_history(user_id: str, limit: int) -> List[Dict[str, Any]]:
    """
    Create mock AI history data for development/testing.
    
    Args:
        user_id: User ID
        limit: Number of mock sessions to create
        
    Returns:
        List of mock AI sessions
    """
    from datetime import datetime, timedelta
    
    mock_sessions = []
    base_time = datetime.utcnow()
    
    # Create a few mock sessions
    mock_data = [
        {
            'prompt': 'Explain quantum computing in simple terms',
            'response': 'Quantum computing is a revolutionary approach to computation that leverages quantum mechanical phenomena...',
            'model': 'anthropic.claude-3-haiku-20240307-v1:0',
            'tokens': 150
        },
        {
            'prompt': 'What are the benefits of renewable energy?',
            'response': 'Renewable energy sources offer numerous benefits including environmental sustainability, reduced carbon emissions...',
            'model': 'anthropic.claude-3-haiku-20240307-v1:0',
            'tokens': 200
        },
        {
            'prompt': 'How does machine learning work?',
            'response': 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve...',
            'model': 'anthropic.claude-3-haiku-20240307-v1:0',
            'tokens': 180
        }
    ]
    
    # Generate mock sessions up to the limit
    for i in range(min(limit, len(mock_data))):
        session_time = base_time - timedelta(hours=i)
        mock_sessions.append({
            'id': f'session-mock-{i+1}',
            'userId': user_id,
            'prompt': mock_data[i]['prompt'],
            'response': mock_data[i]['response'],
            'model': mock_data[i]['model'],
            'tokensUsed': mock_data[i]['tokens'],
            'createdAt': session_time.isoformat() + 'Z'
        })
    
    return mock_sessions


# For testing purposes
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        "requestContext": {
            "http": {
                "method": "GET",
                "path": "/ai/history"
            }
        },
        "queryStringParameters": {
            "userId": "test-user-123",
            "limit": "10"
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