"""
Standardized API response helpers for Lambda functions.
"""
import json
from typing import Any, Dict, Optional, Union


def cors_headers() -> Dict[str, str]:
    """Get standard CORS headers for API responses."""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }


def success_response(data: Any, status_code: int = 200, 
                    additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Create a successful API response.
    
    Args:
        data: Response data
        status_code: HTTP status code
        additional_headers: Additional headers to include
        
    Returns:
        API Gateway response format
    """
    headers = cors_headers()
    if additional_headers:
        headers.update(additional_headers)
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'data': data
        }, default=str)
    }


def error_response(error: str, status_code: int = 500, 
                  error_code: Optional[str] = None,
                  details: Optional[Dict[str, Any]] = None,
                  additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Create an error API response.
    
    Args:
        error: Error message
        status_code: HTTP status code
        error_code: Optional error code
        details: Optional additional error details
        additional_headers: Additional headers to include
        
    Returns:
        API Gateway response format
    """
    headers = cors_headers()
    if additional_headers:
        headers.update(additional_headers)
    
    response_body = {
        'success': False,
        'error': error
    }
    
    if error_code:
        response_body['code'] = error_code
    
    if details:
        response_body['details'] = details
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(response_body, default=str)
    }


def cors_preflight_response() -> Dict[str, Any]:
    """
    Create a CORS preflight response for OPTIONS requests.
    
    Returns:
        API Gateway response format for CORS preflight
    """
    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': ''
    }


def validation_error_response(message: str, 
                            field: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a validation error response.
    
    Args:
        message: Validation error message
        field: Optional field name that failed validation
        
    Returns:
        API Gateway response format
    """
    details = {}
    if field:
        details['field'] = field
    
    return error_response(
        error=message,
        status_code=400,
        error_code='VALIDATION_ERROR',
        details=details
    )


def authentication_error_response(message: str = "Authentication required") -> Dict[str, Any]:
    """
    Create an authentication error response.
    
    Args:
        message: Authentication error message
        
    Returns:
        API Gateway response format
    """
    return error_response(
        error=message,
        status_code=401,
        error_code='AUTHENTICATION_ERROR'
    )


def authorization_error_response(message: str = "Insufficient permissions") -> Dict[str, Any]:
    """
    Create an authorization error response.
    
    Args:
        message: Authorization error message
        
    Returns:
        API Gateway response format
    """
    return error_response(
        error=message,
        status_code=403,
        error_code='AUTHORIZATION_ERROR'
    )


def subscription_error_response(message: str = "Active subscription required") -> Dict[str, Any]:
    """
    Create a subscription error response.
    
    Args:
        message: Subscription error message
        
    Returns:
        API Gateway response format
    """
    return error_response(
        error=message,
        status_code=403,
        error_code='SUBSCRIPTION_ERROR'
    )


def not_found_error_response(message: str = "Resource not found") -> Dict[str, Any]:
    """
    Create a not found error response.
    
    Args:
        message: Not found error message
        
    Returns:
        API Gateway response format
    """
    return error_response(
        error=message,
        status_code=404,
        error_code='NOT_FOUND'
    )


def internal_server_error_response(message: str = "Internal server error") -> Dict[str, Any]:
    """
    Create an internal server error response.
    
    Args:
        message: Error message
        
    Returns:
        API Gateway response format
    """
    return error_response(
        error=message,
        status_code=500,
        error_code='INTERNAL_ERROR'
    )


def parse_json_body(event: Dict[str, Any]) -> Union[Dict[str, Any], None]:
    """
    Parse JSON body from API Gateway event.
    
    Args:
        event: API Gateway event
        
    Returns:
        Parsed JSON data or None if parsing fails
    """
    try:
        if event.get('body'):
            return json.loads(event['body'])
        return {}
    except (json.JSONDecodeError, TypeError):
        return None


def get_path_parameter(event: Dict[str, Any], param_name: str) -> Optional[str]:
    """
    Get path parameter from API Gateway event.
    
    Args:
        event: API Gateway event
        param_name: Parameter name
        
    Returns:
        Parameter value or None
    """
    path_params = event.get('pathParameters') or {}
    return path_params.get(param_name)


def get_query_parameter(event: Dict[str, Any], param_name: str) -> Optional[str]:
    """
    Get query parameter from API Gateway event.
    
    Args:
        event: API Gateway event
        param_name: Parameter name
        
    Returns:
        Parameter value or None
    """
    query_params = event.get('queryStringParameters') or {}
    return query_params.get(param_name)


def get_header(event: Dict[str, Any], header_name: str) -> Optional[str]:
    """
    Get header from API Gateway event (case-insensitive).
    
    Args:
        event: API Gateway event
        header_name: Header name
        
    Returns:
        Header value or None
    """
    headers = event.get('headers') or {}
    
    # Try exact match first
    if header_name in headers:
        return headers[header_name]
    
    # Try case-insensitive match
    header_name_lower = header_name.lower()
    for key, value in headers.items():
        if key.lower() == header_name_lower:
            return value
    
    return None