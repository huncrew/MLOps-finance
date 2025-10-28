"""
Custom exceptions for Lambda functions.
"""


class APIException(Exception):
    """Base exception for API errors."""
    
    def __init__(self, message: str, status_code: int = 500, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class ValidationError(APIException):
    """Exception for validation errors."""
    
    def __init__(self, message: str, field: str = None):
        self.field = field
        super().__init__(message, 400, "VALIDATION_ERROR")


class AuthenticationError(APIException):
    """Exception for authentication errors."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, 401, "AUTHENTICATION_ERROR")


class AuthorizationError(APIException):
    """Exception for authorization errors."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, 403, "AUTHORIZATION_ERROR")


class SubscriptionError(APIException):
    """Exception for subscription-related errors."""
    
    def __init__(self, message: str = "Active subscription required"):
        super().__init__(message, 403, "SUBSCRIPTION_ERROR")


class NotFoundError(APIException):
    """Exception for resource not found errors."""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404, "NOT_FOUND")


class ConflictError(APIException):
    """Exception for resource conflict errors."""
    
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, 409, "CONFLICT_ERROR")


class ExternalServiceError(APIException):
    """Exception for external service errors."""
    
    def __init__(self, message: str, service: str = None):
        self.service = service
        super().__init__(message, 502, "EXTERNAL_SERVICE_ERROR")


class RateLimitError(APIException):
    """Exception for rate limiting errors."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, 429, "RATE_LIMIT_ERROR")


class DatabaseError(APIException):
    """Exception for database errors."""
    
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, 500, "DATABASE_ERROR")