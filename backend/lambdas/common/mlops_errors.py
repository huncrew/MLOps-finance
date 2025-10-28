"""
MLOps-specific error handling and monitoring utilities.

Provides structured error handling, correlation IDs, and monitoring
for MLOps pipeline components.
"""
import json
import uuid
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
import boto3
from botocore.exceptions import ClientError

from .logging import get_logger

logger = get_logger(__name__)


class MLOpsErrorType(Enum):
    """MLOps error type enumeration."""
    DOCUMENT_PROCESSING_ERROR = "document_processing_error"
    EMBEDDING_ERROR = "embedding_error"
    VECTOR_SEARCH_ERROR = "vector_search_error"
    ANALYSIS_ERROR = "analysis_error"
    KNOWLEDGE_BASE_ERROR = "knowledge_base_error"
    RAG_ERROR = "rag_error"
    BEDROCK_ERROR = "bedrock_error"
    S3_ERROR = "s3_error"
    DYNAMODB_ERROR = "dynamodb_error"
    VALIDATION_ERROR = "validation_error"
    RATE_LIMIT_ERROR = "rate_limit_error"
    SUBSCRIPTION_ERROR = "subscription_error"


class MLOpsError(Exception):
    """Base exception for MLOps pipeline errors."""
    
    def __init__(self, message: str, error_type: MLOpsErrorType, 
                 correlation_id: Optional[str] = None, 
                 details: Optional[Dict[str, Any]] = None,
                 original_error: Optional[Exception] = None):
        """
        Initialize MLOps error.
        
        Args:
            message: Error message
            error_type: Type of MLOps error
            correlation_id: Correlation ID for tracing
            details: Additional error details
            original_error: Original exception that caused this error
        """
        super().__init__(message)
        self.message = message
        self.error_type = error_type
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self.details = details or {}
        self.original_error = original_error
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary format."""
        error_dict = {
            'error': self.message,
            'errorType': self.error_type.value,
            'correlationId': self.correlation_id,
            'timestamp': self.timestamp.isoformat(),
            'details': self.details
        }
        
        if self.original_error:
            error_dict['originalError'] = str(self.original_error)
        
        return error_dict


class DocumentProcessingError(MLOpsError):
    """Error during document processing."""
    
    def __init__(self, message: str, **kwargs):
        super().__init__(message, MLOpsErrorType.DOCUMENT_PROCESSING_ERROR, **kwargs)


class EmbeddingError(MLOpsError):
    """Error during embedding generation."""
    
    def __init__(self, message: str, **kwargs):
        super().__init__(message, MLOpsErrorType.EMBEDDING_ERROR, **kwargs)


class VectorSearchError(MLOpsError):
    """Error during vector search operations."""
    
    def __init__(self, message: str, **kwargs):
        super().__init__(message, MLOpsErrorType.VECTOR_SEARCH_ERROR, **kwargs)


class AnalysisError(MLOpsError):
    """Error during document analysis."""
    
    def __init__(self, message: str, **kwargs):
        super().__init__(message, MLOpsErrorType.ANALYSIS_ERROR, **kwargs)


class KnowledgeBaseError(MLOpsError):
    """Error in knowledge base operations."""
    
    def __init__(self, message: str, **kwargs):
        super().__init__(message, MLOpsErrorType.KNOWLEDGE_BASE_ERROR, **kwargs)


class RAGError(MLOpsError):
    """Error in RAG processing."""
    
    def __init__(self, message: str, **kwargs):
        super().__init__(message, MLOpsErrorType.RAG_ERROR, **kwargs)


class BedrockError(MLOpsError):
    """Error with Bedrock API calls."""
    
    def __init__(self, message: str, **kwargs):
        super().__init__(message, MLOpsErrorType.BEDROCK_ERROR, **kwargs)


class MLOpsErrorHandler:
    """Centralized error handling for MLOps operations."""
    
    def __init__(self, service_name: str):
        """
        Initialize error handler.
        
        Args:
            service_name: Name of the service using this handler
        """
        self.service_name = service_name
        self.cloudwatch = None
        
        try:
            self.cloudwatch = boto3.client('cloudwatch')
        except Exception as e:
            logger.warning(f"CloudWatch client not available: {e}")
    
    def handle_error(self, error: Exception, context: Dict[str, Any], 
                    correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Handle and log MLOps errors with proper context.
        
        Args:
            error: The exception that occurred
            context: Context information about the operation
            correlation_id: Optional correlation ID for tracing
            
        Returns:
            Standardized error response
        """
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
        
        # Convert to MLOpsError if not already
        if not isinstance(error, MLOpsError):
            mlops_error = self._convert_to_mlops_error(error, correlation_id, context)
        else:
            mlops_error = error
            if not mlops_error.correlation_id:
                mlops_error.correlation_id = correlation_id
        
        # Log error with full context
        self._log_error(mlops_error, context)
        
        # Send metrics to CloudWatch
        self._send_error_metrics(mlops_error)
        
        # Return user-friendly error response
        return self._create_error_response(mlops_error)
    
    def _convert_to_mlops_error(self, error: Exception, correlation_id: str, 
                               context: Dict[str, Any]) -> MLOpsError:
        """Convert generic exception to MLOpsError."""
        error_message = str(error)
        
        # Determine error type based on error message and context
        if isinstance(error, ClientError):
            service = error.response.get('Error', {}).get('Code', '')
            if 'bedrock' in service.lower() or 'bedrock' in error_message.lower():
                return BedrockError(
                    f"Bedrock API error: {error_message}",
                    correlation_id=correlation_id,
                    details={'aws_error_code': service, 'context': context},
                    original_error=error
                )
            elif 's3' in service.lower() or 's3' in error_message.lower():
                return MLOpsError(
                    f"S3 error: {error_message}",
                    MLOpsErrorType.S3_ERROR,
                    correlation_id=correlation_id,
                    details={'aws_error_code': service, 'context': context},
                    original_error=error
                )
            elif 'dynamodb' in service.lower() or 'dynamodb' in error_message.lower():
                return MLOpsError(
                    f"DynamoDB error: {error_message}",
                    MLOpsErrorType.DYNAMODB_ERROR,
                    correlation_id=correlation_id,
                    details={'aws_error_code': service, 'context': context},
                    original_error=error
                )
        
        # Check for specific error patterns
        if 'embedding' in error_message.lower():
            return EmbeddingError(
                error_message,
                correlation_id=correlation_id,
                details={'context': context},
                original_error=error
            )
        elif 'vector' in error_message.lower() or 'search' in error_message.lower():
            return VectorSearchError(
                error_message,
                correlation_id=correlation_id,
                details={'context': context},
                original_error=error
            )
        elif 'analysis' in error_message.lower():
            return AnalysisError(
                error_message,
                correlation_id=correlation_id,
                details={'context': context},
                original_error=error
            )
        elif 'validation' in error_message.lower() or isinstance(error, ValueError):
            return MLOpsError(
                error_message,
                MLOpsErrorType.VALIDATION_ERROR,
                correlation_id=correlation_id,
                details={'context': context},
                original_error=error
            )
        else:
            # Generic MLOps error
            return MLOpsError(
                f"MLOps operation failed: {error_message}",
                MLOpsErrorType.DOCUMENT_PROCESSING_ERROR,
                correlation_id=correlation_id,
                details={'context': context},
                original_error=error
            )
    
    def _log_error(self, error: MLOpsError, context: Dict[str, Any]) -> None:
        """Log error with structured format."""
        log_data = {
            'service': self.service_name,
            'correlationId': error.correlation_id,
            'errorType': error.error_type.value,
            'message': error.message,
            'timestamp': error.timestamp.isoformat(),
            'context': context,
            'details': error.details
        }
        
        if error.original_error:
            log_data['originalError'] = str(error.original_error)
            log_data['traceback'] = traceback.format_exc()
        
        logger.error(
            f"MLOps Error [{error.correlation_id}]: {error.message}",
            extra=log_data
        )
    
    def _send_error_metrics(self, error: MLOpsError) -> None:
        """Send error metrics to CloudWatch."""
        if not self.cloudwatch:
            return
        
        try:
            # Send custom metric for error type
            self.cloudwatch.put_metric_data(
                Namespace=f'MLOps/{self.service_name}',
                MetricData=[
                    {
                        'MetricName': 'Errors',
                        'Dimensions': [
                            {
                                'Name': 'ErrorType',
                                'Value': error.error_type.value
                            },
                            {
                                'Name': 'Service',
                                'Value': self.service_name
                            }
                        ],
                        'Value': 1,
                        'Unit': 'Count',
                        'Timestamp': error.timestamp
                    }
                ]
            )
        except Exception as e:
            logger.warning(f"Failed to send error metrics: {e}")
    
    def _create_error_response(self, error: MLOpsError) -> Dict[str, Any]:
        """Create user-friendly error response."""
        # Map internal error types to user-friendly messages
        user_messages = {
            MLOpsErrorType.DOCUMENT_PROCESSING_ERROR: "Failed to process document. Please check the file format and try again.",
            MLOpsErrorType.EMBEDDING_ERROR: "Failed to generate document embeddings. Please try again.",
            MLOpsErrorType.VECTOR_SEARCH_ERROR: "Failed to search knowledge base. Please try again.",
            MLOpsErrorType.ANALYSIS_ERROR: "Failed to analyze document. Please try again.",
            MLOpsErrorType.KNOWLEDGE_BASE_ERROR: "Knowledge base operation failed. Please try again.",
            MLOpsErrorType.RAG_ERROR: "Failed to process query. Please try again.",
            MLOpsErrorType.BEDROCK_ERROR: "AI service temporarily unavailable. Please try again.",
            MLOpsErrorType.S3_ERROR: "File storage error. Please try again.",
            MLOpsErrorType.DYNAMODB_ERROR: "Database error. Please try again.",
            MLOpsErrorType.VALIDATION_ERROR: error.message,  # Show validation errors directly
            MLOpsErrorType.RATE_LIMIT_ERROR: "Rate limit exceeded. Please wait before trying again.",
            MLOpsErrorType.SUBSCRIPTION_ERROR: "This feature requires an active subscription."
        }
        
        user_message = user_messages.get(error.error_type, "An unexpected error occurred. Please try again.")
        
        response = {
            'success': False,
            'error': user_message,
            'errorType': error.error_type.value,
            'correlationId': error.correlation_id,
            'timestamp': error.timestamp.isoformat()
        }
        
        # Include validation details for validation errors
        if error.error_type == MLOpsErrorType.VALIDATION_ERROR and error.details:
            response['validationErrors'] = error.details.get('validation_errors', {})
        
        return response


class HealthChecker:
    """Health check utility for MLOps components."""
    
    def __init__(self, service_name: str):
        """Initialize health checker."""
        self.service_name = service_name
        self.checks = []
    
    def add_check(self, name: str, check_func, timeout: int = 5):
        """Add a health check function."""
        self.checks.append({
            'name': name,
            'function': check_func,
            'timeout': timeout
        })
    
    def run_health_checks(self) -> Dict[str, Any]:
        """Run all health checks and return results."""
        results = {
            'service': self.service_name,
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'healthy',
            'checks': []
        }
        
        for check in self.checks:
            check_result = self._run_single_check(check)
            results['checks'].append(check_result)
            
            if check_result['status'] != 'healthy':
                results['overall_status'] = 'unhealthy'
        
        return results
    
    def _run_single_check(self, check: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single health check."""
        start_time = datetime.utcnow()
        
        try:
            # Run the check function
            check['function']()
            
            return {
                'name': check['name'],
                'status': 'healthy',
                'duration_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000),
                'message': 'Check passed'
            }
            
        except Exception as e:
            return {
                'name': check['name'],
                'status': 'unhealthy',
                'duration_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000),
                'message': str(e),
                'error': type(e).__name__
            }


def create_correlation_id() -> str:
    """Create a new correlation ID for request tracing."""
    return str(uuid.uuid4())


def extract_correlation_id(event: Dict[str, Any]) -> str:
    """Extract correlation ID from Lambda event or create new one."""
    # Try to get from headers
    headers = event.get('headers', {})
    correlation_id = headers.get('X-Correlation-ID') or headers.get('x-correlation-id')
    
    if correlation_id:
        return correlation_id
    
    # Try to get from request context
    request_context = event.get('requestContext', {})
    request_id = request_context.get('requestId')
    
    if request_id:
        return request_id
    
    # Create new correlation ID
    return create_correlation_id()


def add_correlation_id_to_response(response: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
    """Add correlation ID to API response headers."""
    if 'headers' not in response:
        response['headers'] = {}
    
    response['headers']['X-Correlation-ID'] = correlation_id
    return response
