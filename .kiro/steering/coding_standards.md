# Coding Standards

Guidelines for writing clean, maintainable code in the MLOps Finance platform.

## Required Reading

Before making code changes, review these essential documents:

1. **docs/architecture/architecture.md** - System architecture and component interactions
2. **docs/context/context.md** - Business domain knowledge and terminology
3. **backend/lambdas/common/models.py** - Existing data models and validation patterns
4. **docs/api/mlops-endpoints.md** - API contracts and integration patterns

## Python Standards

### Code Quality
- **Type hints** for all function parameters and return values
- **Dataclasses** for structured data instead of dictionaries
- **F-strings** for string formatting
- **Context managers** (`with` statements) for resource management
- **Specific exceptions** - avoid bare `except:`

### Formatting
- **Black** for automatic code formatting (88 character line length)
- **Ruff** for linting and import sorting
- **Google-style docstrings** for functions and classes

### Example
```python
from typing import Dict, Any, Optional
from dataclasses import dataclass
from common.logging import get_logger

logger = get_logger(__name__)

@dataclass
class UserRequest:
    user_id: str
    email: str
    subscription_status: str = "inactive"
    
    def validate(self) -> None:
        """Validate user request data."""
        if not self.user_id:
            raise ValueError("User ID is required")

def process_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Process user request with proper error handling."""
    try:
        user_request = UserRequest(**event.get('body', {}))
        user_request.validate()
        logger.info(f"Processing request for user: {user_request.user_id}")
        return {"success": True, "user_id": user_request.user_id}
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise
```

## Terraform Standards

### Organization
- **Modular design** with reusable components
- **Descriptive naming** with project/stage prefixes
- **Resource tags** on all AWS resources
- **Pin provider versions** explicitly

### Security
- **Least-privilege IAM** policies with specific ARNs
- **No wildcard permissions** in production
- **Parameterized ARNs** for cross-environment deployment

### Example
```hcl
variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  validation {
    condition     = length(var.project_name) > 0
    error_message = "Project name cannot be empty."
  }
}

resource "aws_lambda_function" "api_handler" {
  function_name = "${var.project_name}-${var.stage}-api-handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 512
  
  role = aws_iam_role.lambda_role.arn
  
  tags = {
    Project     = var.project_name
    Environment = var.stage
    ManagedBy   = "terraform"
  }
}
```

## Frontend Standards

### TypeScript
- **Maintain existing interfaces** - don't break API contracts
- **Environment variables** with NEXT_PUBLIC_ prefix for client-side
- **Error boundaries** for graceful error handling

### Integration
- **Update API endpoints only** - preserve request/response formats
- **Keep existing component props** unchanged
- **Maintain current error handling patterns**

## Testing Standards

### Focus Areas
- **Unit tests** for core business logic and data models
- **Integration tests** for API endpoints and database operations
- **Real AWS services** in test environments when possible

### Structure
```python
def test_user_creation_valid():
    """Test valid user creation."""
    user = User(id="test-123", email="test@example.com")
    assert user.id == "test-123"
    assert user.email == "test@example.com"

def test_user_creation_invalid_email():
    """Test user creation with invalid email."""
    with pytest.raises(ValueError, match="Invalid email format"):
        User(id="test-123", email="invalid-email")
```

## Security Standards

### Input Validation
- **Validate all inputs** using data models and validation functions
- **Sanitize user data** before processing
- **Enforce size limits** on uploads and requests

### AWS Security
- **Least privilege** IAM policies
- **Resource-level permissions** with specific ARNs
- **Encryption** at rest and in transit
- **SSM Parameter Store** for configuration secrets

## Key Principles

- **Real integrations** - Use actual AWS services, avoid mocks
- **Type safety** - Comprehensive type hints and validation
- **Error handling** - Specific exceptions with proper logging
- **Performance** - Efficient S3 vector search and DynamoDB queries
- **Security** - Multi-tenant isolation and audit trails