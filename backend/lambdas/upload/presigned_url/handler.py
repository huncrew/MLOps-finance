"""
S3 presigned URL Lambda handler.
Generates secure presigned URLs for file uploads.
"""
import json
import time
import uuid
from typing import Dict, Any, Optional, List
from common.logging import get_logger, log_lambda_event, log_lambda_response
from common.response import (
    success_response, error_response, cors_preflight_response,
    parse_json_body, validation_error_response, internal_server_error_response
)
from common.env import config
from common.exceptions import ValidationError, ExternalServiceError

logger = get_logger(__name__)

# Import AWS S3 (will be available when deployed)
try:
    import boto3
    from botocore.exceptions import ClientError
    s3_client = boto3.client('s3', region_name=config.aws_region)
except ImportError:
    logger.warning("AWS SDK not available - using mock for development")
    s3_client = None

# Allowed file types and their MIME types
ALLOWED_FILE_TYPES = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
}

# Maximum file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    S3 presigned URL Lambda handler.
    
    Generates presigned URLs for secure file uploads to S3.
    
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
        
        # Validate request
        validation_error = validate_upload_request(body)
        if validation_error:
            return validation_error_response(validation_error)
        
        # Extract request parameters
        filename = body.get('filename')
        file_type = body.get('fileType', '').lower()
        file_size = body.get('fileSize', 0)
        user_id = body.get('userId', 'anonymous')
        
        logger.info(f"Generating presigned URL for file: {filename}, type: {file_type}, size: {file_size}")
        
        # Generate presigned URL
        upload_data = generate_presigned_url(filename, file_type, file_size, user_id)
        
        response = success_response(upload_data)
        
        # Log successful response
        duration_ms = (time.time() - start_time) * 1000
        log_lambda_response(logger, response, context, duration_ms)
        
        return response
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}")
        return validation_error_response(e.message)
        
    except ExternalServiceError as e:
        logger.error(f"S3 service error: {e.message}")
        return error_response("Failed to generate upload URL", 502, "S3_SERVICE_ERROR")
        
    except Exception as e:
        logger.error(f"Unexpected error in upload URL handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Failed to generate upload URL")


def validate_upload_request(body: Dict[str, Any]) -> Optional[str]:
    """
    Validate upload request parameters.
    
    Args:
        body: Request body
        
    Returns:
        Error message if validation fails, None if valid
    """
    # Check required fields
    filename = body.get('filename')
    if not filename:
        return "Filename is required"
    
    file_type = body.get('fileType', '').lower()
    if not file_type:
        return "File type is required"
    
    file_size = body.get('fileSize', 0)
    if not isinstance(file_size, int) or file_size <= 0:
        return "Valid file size is required"
    
    # Validate file type
    if file_type not in ALLOWED_FILE_TYPES:
        allowed_types = ', '.join(ALLOWED_FILE_TYPES.keys())
        return f"File type '{file_type}' not allowed. Allowed types: {allowed_types}"
    
    # Validate file size
    if file_size > MAX_FILE_SIZE:
        max_size_mb = MAX_FILE_SIZE // (1024 * 1024)
        return f"File size too large. Maximum allowed: {max_size_mb}MB"
    
    # Validate filename
    if len(filename) > 255:
        return "Filename too long (max 255 characters)"
    
    # Check for dangerous characters
    dangerous_chars = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*']
    if any(char in filename for char in dangerous_chars):
        return "Filename contains invalid characters"
    
    return None


def generate_presigned_url(filename: str, file_type: str, file_size: int, 
                          user_id: str) -> Dict[str, Any]:
    """
    Generate presigned URL for S3 upload.
    
    Args:
        filename: Original filename
        file_type: File extension/type
        file_size: File size in bytes
        user_id: User ID for organization
        
    Returns:
        Dictionary with presigned URL and metadata
    """
    bucket_name = config.get_uploads_bucket_name()
    
    if not s3_client:
        # Mock response for development
        logger.warning("S3 client not available - returning mock presigned URL")
        return {
            'uploadUrl': f'https://mock-bucket.s3.amazonaws.com/mock-upload-url?signature=mock',
            'key': f'uploads/{user_id}/mock-{filename}',
            'bucket': bucket_name,
            'expiresIn': 3600,
            'maxFileSize': MAX_FILE_SIZE,
            'contentType': ALLOWED_FILE_TYPES.get(file_type, 'application/octet-stream')
        }
    
    try:
        # Generate unique key for the file
        file_id = str(uuid.uuid4())
        file_extension = f".{file_type}" if not filename.endswith(f".{file_type}") else ""
        safe_filename = sanitize_filename(filename)
        object_key = f"uploads/{user_id}/{file_id}-{safe_filename}{file_extension}"
        
        # Content type for the file
        content_type = ALLOWED_FILE_TYPES.get(file_type, 'application/octet-stream')
        
        # Generate presigned URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_key,
                'ContentType': content_type,
                'ContentLength': file_size
            },
            ExpiresIn=3600,  # 1 hour
            HttpMethod='PUT'
        )
        
        logger.info(f"Generated presigned URL for key: {object_key}")
        
        return {
            'uploadUrl': presigned_url,
            'key': object_key,
            'bucket': bucket_name,
            'expiresIn': 3600,
            'maxFileSize': MAX_FILE_SIZE,
            'contentType': content_type
        }
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', str(e))
        logger.error(f"S3 API error [{error_code}]: {error_message}")
        raise ExternalServiceError(f"S3 API error: {error_message}", "s3")
        
    except Exception as e:
        logger.error(f"Error generating presigned URL: {str(e)}")
        raise ExternalServiceError(f"Failed to generate presigned URL: {str(e)}", "s3")


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe S3 storage.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove or replace problematic characters
    import re
    
    # Remove path components
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Replace spaces and special characters with underscores
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    
    # Remove multiple consecutive underscores
    filename = re.sub(r'_+', '_', filename)
    
    # Ensure filename is not empty
    if not filename or filename == '.':
        filename = 'unnamed_file'
    
    return filename


# For testing purposes
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        "requestContext": {
            "http": {
                "method": "POST",
                "path": "/upload/url"
            }
        },
        "body": json.dumps({
            "filename": "test-document.pdf",
            "fileType": "pdf",
            "fileSize": 1024000,  # 1MB
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