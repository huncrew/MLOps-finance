# Coding Standards

## Python Standards

### Language Version and Features
- **Python 3.11**: Use modern Python features and syntax
- **Type Hints**: Use type annotations for function parameters and return values
- **Dataclasses**: Prefer dataclasses over plain dictionaries for structured data
- **F-strings**: Use f-string formatting for string interpolation
- **Context Managers**: Use `with` statements for resource management

### Code Formatting
- **Black**: Automatic code formatting with default settings
- **Line Length**: 88 characters (Black default)
- **Import Sorting**: Use isort or ruff for consistent import organization
- **Docstrings**: Google-style docstrings for functions and classes

### Code Quality
- **Ruff**: Use ruff for linting and code quality checks
- **Error Handling**: Always use specific exception types, avoid bare `except:`
- **Logging**: Use structured logging with the common logging utilities
- **Constants**: Use UPPER_CASE for constants, define at module level

### Example Python Code
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
        if "@" not in self.email:
            raise ValueError("Invalid email format")

def process_user_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process user request with proper error handling.
    
    Args:
        event: API Gateway event
        
    Returns:
        Processed response data
        
    Raises:
        ValueError: If request data is invalid
    """
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

### Code Organization
- **Module Structure**: Use modules for reusable components
- **File Naming**: Use descriptive names (main.tf, variables.tf, outputs.tf)
- **Resource Naming**: Consistent naming with project/stage prefixes
- **Comments**: Document complex logic and business requirements

### Formatting and Style
- **terraform fmt**: Always format code before committing
- **Explicit Versions**: Pin provider versions explicitly
- **No Wildcards**: Avoid wildcard permissions in IAM policies
- **Resource Tags**: Apply consistent tags to all resources

### Variables and Outputs
- **Variable Descriptions**: Provide clear descriptions for all variables
- **Type Constraints**: Use specific types (string, number, list, map)
- **Default Values**: Provide sensible defaults where appropriate
- **Output Documentation**: Document all outputs with descriptions

### Example Terraform Code
```hcl
# Variables with proper typing and descriptions
variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  validation {
    condition     = length(var.project_name) > 0
    error_message = "Project name cannot be empty."
  }
}

variable "lambda_config" {
  description = "Configuration for Lambda functions"
  type = object({
    timeout     = number
    memory_size = number
    runtime     = string
  })
  default = {
    timeout     = 30
    memory_size = 512
    runtime     = "python3.11"
  }
}

# Resource with proper naming and tagging
resource "aws_lambda_function" "api_handler" {
  function_name = "${var.project_name}-${var.stage}-api-handler"
  runtime       = var.lambda_config.runtime
  timeout       = var.lambda_config.timeout
  memory_size   = var.lambda_config.memory_size
  
  # Least-privilege IAM
  role = aws_iam_role.lambda_role.arn
  
  tags = {
    Project     = var.project_name
    Environment = var.stage
    ManagedBy   = "terraform"
  }
}

# IAM with specific permissions
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.stage}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/${var.table_name}"
      }
    ]
  })
}
```

## JavaScript/TypeScript Standards

### Frontend Code (Next.js)
- **Keep Existing Lints**: Don't modify existing ESLint configuration
- **Avoid Breaking Changes**: Don't alter existing component interfaces
- **Environment Variables**: Use NEXT_PUBLIC_ prefix for client-side variables
- **API Integration**: Update only the API endpoint URLs, not the request/response formats

### Type Safety
- **Maintain Types**: Keep existing TypeScript interfaces
- **API Contracts**: Don't change existing API response formats
- **Component Props**: Preserve existing component prop interfaces
- **Error Handling**: Maintain existing error handling patterns

### Example Frontend Integration
```typescript
// Update only the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Keep existing API call patterns
async function createCheckoutSession(priceId: string, userId: string) {
  const response = await fetch(`${API_BASE_URL}/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, userId })
  });
  
  // Maintain existing response format
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.data;
}
```

## Testing Standards

### Testing Minimums
- **Unit Tests**: Test core business logic and data models
- **Integration Tests**: Test API endpoints and database operations
- **Mocking**: Use moto for AWS service mocking in tests
- **Coverage**: Focus on critical paths, not 100% coverage

### Test Structure
```python
# tests/unit/test_models.py
import pytest
from common.models import User, ValidationError

def test_user_creation_valid():
    """Test valid user creation."""
    user = User(id="test-123", email="test@example.com")
    assert user.id == "test-123"
    assert user.email == "test@example.com"

def test_user_creation_invalid_email():
    """Test user creation with invalid email."""
    with pytest.raises(ValueError, match="Invalid email format"):
        User(id="test-123", email="invalid-email")

# tests/integration/test_auth_handler.py
import json
from moto import mock_dynamodb
from api.auth.handler import handler

@mock_dynamodb
def test_auth_handler_get_user():
    """Test auth handler get user functionality."""
    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({"action": "getUser", "userId": "test-123"})
    }
    
    response = handler(event, MockContext())
    assert response["statusCode"] == 200
```

### Testing Guidelines
- **Fast Tests**: Keep unit tests fast and isolated
- **Real Services**: Use real AWS services for integration tests in test environment
- **Test Data**: Use factories or fixtures for consistent test data
- **Error Cases**: Test error conditions and edge cases

## Security Standards

### Input Validation
- **Validate All Inputs**: Use data models and validation functions
- **Sanitize Data**: Clean user inputs before processing
- **Type Checking**: Use type hints and runtime validation
- **Size Limits**: Enforce reasonable limits on input sizes

### Error Handling
- **Don't Leak Information**: Avoid exposing internal details in error messages
- **Log Security Events**: Log authentication failures and suspicious activity
- **Fail Securely**: Default to denying access when in doubt
- **Rate Limiting**: Implement appropriate rate limiting

### AWS Security
- **Least Privilege**: Grant minimum required permissions
- **Resource-Level Permissions**: Use specific ARNs, not wildcards
- **Encryption**: Use encryption at rest and in transit
- **Secrets Management**: Store secrets in SSM Parameter Store

## Documentation Standards

### Code Documentation
- **Docstrings**: Document all public functions and classes
- **Comments**: Explain complex business logic and algorithms
- **Type Hints**: Use type annotations as documentation
- **Examples**: Provide usage examples for complex functions

### API Documentation
- **Request/Response**: Document all API endpoints with examples
- **Error Codes**: Document all possible error responses
- **Authentication**: Clearly document authentication requirements
- **Rate Limits**: Document any rate limiting or quotas

### Infrastructure Documentation
- **Architecture Diagrams**: Keep architecture documentation current
- **Deployment Guides**: Document deployment procedures
- **Troubleshooting**: Document common issues and solutions
- **Runbooks**: Create operational procedures for common tasks

## Performance Standards

### Lambda Optimization
- **Cold Start Mitigation**: Reuse connections and clients
- **Memory Allocation**: Right-size memory for performance/cost balance
- **Timeout Settings**: Set appropriate timeouts for each function
- **Dependency Management**: Minimize package sizes and dependencies

### Database Performance
- **Access Patterns**: Design efficient DynamoDB access patterns
- **Batch Operations**: Use batch operations where appropriate
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Avoid full table scans

### Monitoring Requirements
- **Structured Logging**: Use consistent log formats with correlation IDs
- **Metrics**: Track business and technical metrics
- **Alarms**: Set up appropriate CloudWatch alarms
- **Dashboards**: Create monitoring dashboards for system health

## Code Review Checklist

### Before Submitting
- [ ] Code is formatted with black/terraform fmt
- [ ] All tests pass locally
- [ ] No hardcoded secrets or configuration
- [ ] Proper error handling implemented
- [ ] Documentation updated for changes

### Review Criteria
- [ ] Follows established patterns and conventions
- [ ] Proper error handling and logging
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Tests cover critical functionality