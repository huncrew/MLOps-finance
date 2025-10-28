# Design Document

## Overview

This design document outlines the technical architecture for migrating the existing SST-based SaaS template to a Terraform-managed infrastructure with Python Lambda functions. The migration maintains all existing functionality while providing better infrastructure control, AI/ML integration capabilities, and standardized deployment processes.

The design preserves the existing Next.js frontend entirely, focusing on backend infrastructure transformation and ensuring seamless integration between the new Python backend and existing frontend components.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Next.js       │    │  API Gateway     │    │   Lambda Functions  │
│   Frontend      │───▶│  HTTP API        │───▶│   (Python 3.11)     │
│   (Unchanged)   │    │  + CORS          │    │   - Auth Handler    │
└─────────────────┘    └──────────────────┘    │   - Stripe Handler  │
                                               │   - AI Handler      │
                                               │   - Subscription    │
                                               └─────────────────────┘
                                                         │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       │                                 │                                 │
                       ▼                                 ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │   DynamoDB      │              │   S3 Bucket     │              │   Cognito       │
              │   Single Table  │              │   File Uploads  │              │   User Pool     │
              │   Design        │              │   + Events      │              │   (Existing)    │
              └─────────────────┘              └─────────────────┘              └─────────────────┘
```

### Infrastructure Components

#### Terraform Module Structure
```
infra/terraform/
├── main.tf                    # Root configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── providers.tf               # Provider configuration
├── versions.tf                # Version constraints
└── modules/
    ├── api_gateway_http/      # API Gateway HTTP API module
    ├── lambda_function/       # Lambda function module
    └── s3_bucket/            # S3 bucket module
```

#### Backend Code Structure
```
backend/
├── lambdas/
│   ├── common/               # Shared utilities
│   │   ├── __init__.py
│   │   ├── env.py           # Environment configuration
│   │   ├── logging.py       # Structured logging
│   │   ├── response.py      # API response helpers
│   │   └── dynamodb.py      # DynamoDB service layer
│   ├── api/
│   │   ├── auth/
│   │   │   ├── handler.py   # Authentication handler
│   │   │   └── requirements.txt
│   │   ├── stripe/
│   │   │   ├── handler.py   # Stripe payment handler
│   │   │   ├── webhook.py   # Stripe webhook handler
│   │   │   └── requirements.txt
│   │   ├── subscription/
│   │   │   ├── handler.py   # Subscription status handler
│   │   │   └── requirements.txt
│   │   └── ai/
│   │       ├── handler.py   # AI generation handler
│   │       ├── history.py   # AI history handler
│   │       └── requirements.txt
│   └── upload/
│       ├── presigned_url/
│       │   ├── handler.py   # S3 presigned URL generator
│       │   └── requirements.txt
│       └── process/
│           ├── handler.py   # File processing (future)
│           └── requirements.txt
├── Makefile                 # Build automation
└── requirements-dev.txt     # Development dependencies
```

## Components and Interfaces

### API Gateway HTTP API

**Purpose**: Provides REST API endpoints with CORS support for the Next.js frontend

**Configuration**:
- HTTP API (not REST API) for better performance and cost
- Stage-based deployment (dev, staging, production)
- CORS configuration for frontend domains
- Custom domain support (optional)

**Routes Mapping**:
```
POST   /auth/session           → auth_handler
POST   /stripe/checkout        → stripe_handler  
POST   /stripe/webhook         → stripe_webhook_handler
GET    /subscription/status    → subscription_handler
POST   /ai/generate           → ai_handler
GET    /ai/history            → ai_history_handler
POST   /upload/url            → upload_url_handler
```

### Lambda Functions

**Runtime**: Python 3.11
**Packaging**: Zip files with dependencies
**Memory**: 512MB (configurable per function)
**Timeout**: 30 seconds (configurable per function)

#### Common Layer Structure
```python
# common/env.py
import os
from typing import Optional

class Config:
    def __init__(self):
        self.database_table_name = os.environ.get('DATABASE_TABLE_NAME')
        self.aws_region = os.environ.get('AWS_REGION', 'us-east-1')
        self.stage = os.environ.get('STAGE', 'dev')
    
    def get_ssm_parameter(self, name: str) -> Optional[str]:
        # Implementation for SSM parameter retrieval
        pass

# common/response.py
from typing import Any, Dict, Optional
import json

def success_response(data: Any, status_code: int = 200) -> Dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps({
            'success': True,
            'data': data
        })
    }

def error_response(error: str, status_code: int = 500) -> Dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps({
            'success': False,
            'error': error
        })
    }
```

#### Handler Interface Pattern
```python
# Standard handler signature
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Standard Lambda handler for API Gateway HTTP API events
    
    Args:
        event: API Gateway HTTP API event
        context: Lambda context object
        
    Returns:
        API Gateway HTTP API response format
    """
    # CORS preflight handling
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response()
    
    try:
        # Request processing logic
        result = process_request(event)
        return success_response(result)
    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return error_response("Internal server error")
```

### DynamoDB Integration

**Table Design**: Single table design with GSI for efficient queries
**Access Pattern**: Maintain existing data access patterns from TypeScript implementation

```python
# common/dynamodb.py
import boto3
from typing import Dict, Any, Optional, List
from boto3.dynamodb.conditions import Key

class DynamoDBService:
    def __init__(self, table_name: str):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        response = self.table.get_item(
            Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'}
        )
        return response.get('Item')
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        item = {
            'pk': f'USER#{user_data["id"]}',
            'sk': 'PROFILE',
            **user_data,
            'createdAt': datetime.utcnow().isoformat()
        }
        self.table.put_item(Item=item)
        return item
    
    def get_subscription(self, user_id: str) -> Optional[Dict[str, Any]]:
        response = self.table.get_item(
            Key={'pk': f'USER#{user_id}', 'sk': 'SUBSCRIPTION'}
        )
        return response.get('Item')
```

### S3 Integration

**Bucket Configuration**:
- Versioning enabled
- Server-side encryption (optional KMS)
- Lifecycle policies for cost optimization
- Event notifications for processing pipeline

**Presigned URL Generation**:
```python
# upload/presigned_url/handler.py
import boto3
from botocore.exceptions import ClientError

def generate_presigned_url(bucket_name: str, object_key: str, expiration: int = 3600) -> str:
    s3_client = boto3.client('s3')
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': object_key},
            ExpiresIn=expiration
        )
        return response
    except ClientError as e:
        raise Exception(f"Error generating presigned URL: {str(e)}")
```

### Stripe Integration

**Payment Processing**: Maintain existing Stripe integration patterns
**Webhook Handling**: Secure webhook signature verification

```python
# api/stripe/handler.py
import stripe
from common.env import Config

def create_checkout_session(price_id: str, user_id: str) -> Dict[str, Any]:
    stripe.api_key = Config().get_ssm_parameter('STRIPE_SECRET_KEY')
    
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        ui_mode='embedded',
        line_items=[{'price': price_id, 'quantity': 1}],
        mode='subscription',
        return_url=f"{Config().frontend_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
        metadata={'userId': user_id}
    )
    
    return {
        'clientSecret': session.client_secret,
        'sessionId': session.id
    }
```

## Data Models

### User Model
```python
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class User:
    id: str
    email: str
    subscription_status: str = 'inactive'
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'email': self.email,
            'subscriptionStatus': self.subscription_status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
```

### Subscription Model
```python
@dataclass
class Subscription:
    id: str
    user_id: str
    stripe_subscription_id: str
    status: str
    plan_id: str
    current_period_start: datetime
    current_period_end: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'userId': self.user_id,
            'stripeSubscriptionId': self.stripe_subscription_id,
            'status': self.status,
            'planId': self.plan_id,
            'currentPeriodStart': self.current_period_start.isoformat(),
            'currentPeriodEnd': self.current_period_end.isoformat()
        }
```

### AI Session Model
```python
@dataclass
class AISession:
    id: str
    user_id: str
    prompt: str
    response: str
    model: str
    tokens_used: int
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'userId': self.user_id,
            'prompt': self.prompt,
            'response': self.response,
            'model': self.model,
            'tokensUsed': self.tokens_used,
            'createdAt': self.created_at.isoformat()
        }
```

## Error Handling

### Centralized Error Handling
```python
# common/exceptions.py
class APIException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ValidationError(APIException):
    def __init__(self, message: str):
        super().__init__(message, 400)

class AuthenticationError(APIException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, 401)

class SubscriptionError(APIException):
    def __init__(self, message: str = "Active subscription required"):
        super().__init__(message, 403)
```

### Error Response Format
```python
# Consistent error response structure
{
    "success": false,
    "error": "Error message",
    "code": "ERROR_CODE",  # Optional error code
    "details": {}          # Optional additional details
}
```

## Testing Strategy

### Unit Testing Framework
- **Framework**: pytest
- **Coverage**: Core business logic and data models
- **Mocking**: boto3 services using moto library

### Integration Testing
- **API Testing**: Test complete request/response cycles
- **Database Testing**: Test DynamoDB operations with local DynamoDB
- **External Services**: Mock Stripe and AWS Bedrock calls

### Test Structure
```
backend/tests/
├── unit/
│   ├── test_models.py
│   ├── test_dynamodb_service.py
│   └── test_handlers/
│       ├── test_auth_handler.py
│       ├── test_stripe_handler.py
│       └── test_ai_handler.py
├── integration/
│   ├── test_api_endpoints.py
│   └── test_stripe_integration.py
└── fixtures/
    ├── dynamodb_fixtures.py
    └── api_fixtures.py
```

### Build and Deployment Testing
```makefile
# Makefile targets for testing
test:
	pytest backend/tests/ -v --cov=backend/lambdas

test-unit:
	pytest backend/tests/unit/ -v

test-integration:
	pytest backend/tests/integration/ -v

lint:
	ruff check backend/lambdas/
	black --check backend/lambdas/

format:
	black backend/lambdas/
	ruff --fix backend/lambdas/
```

## Security Considerations

### IAM Least Privilege
- Function-specific IAM roles
- Resource-level permissions with ARN parameterization
- No wildcard permissions in production

### Secrets Management
- SSM Parameter Store for configuration
- No hardcoded secrets in code or Terraform
- Environment-specific parameter paths

### Input Validation
- Request payload validation using Pydantic models
- SQL injection prevention (DynamoDB NoSQL)
- XSS prevention in API responses

### CORS Configuration
- Restricted origins based on environment
- Proper headers for security
- Preflight request handling

## Migration Strategy

### Phase 1: Infrastructure Setup
1. Create Terraform configuration
2. Deploy parallel infrastructure
3. Validate resource creation

### Phase 2: Backend Migration
1. Implement Python Lambda functions
2. Deploy functions to new infrastructure
3. Test API endpoints independently

### Phase 3: Integration Testing
1. Update frontend environment variables
2. Test complete user workflows
3. Validate Stripe webhook integration

### Phase 4: Cutover and Cleanup
1. Switch DNS/routing to new infrastructure
2. Monitor system health
3. Remove old SST infrastructure

This design provides a comprehensive foundation for migrating the existing SaaS template while maintaining functionality and improving infrastructure management capabilities.