# Implementation Plan

- [x] 1. Set up Terraform infrastructure foundation
  - Create Terraform project structure under `infra/terraform/`
  - Configure providers, versions, and basic variables
  - Set up modular structure for reusable components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Create Terraform project structure and configuration files
  - Write `providers.tf` with AWS provider version constraints ≥5.x
  - Write `versions.tf` with Terraform version constraints ≥1.6
  - Write `variables.tf` with project_name, stage, region, and bucket parameters
  - Write `outputs.tf` for API base URL and bucket names
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.2 Create reusable Terraform modules
  - Create `modules/api_gateway_http/` module for API Gateway HTTP API
  - Create `modules/lambda_function/` module for Lambda function deployment
  - Create `modules/s3_bucket/` module for S3 bucket configuration
  - _Requirements: 1.3_

- [x] 1.3 Implement main Terraform configuration
  - Write `main.tf` with DynamoDB table, Cognito User Pool, and API Gateway
  - Configure CORS settings for frontend domains
  - Set up IAM roles with least-privilege permissions
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Create Python Lambda function structure and common utilities
  - Set up backend directory structure with common utilities
  - Implement shared services for DynamoDB, logging, and responses
  - Create base handler patterns and error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Create backend project structure and common utilities
  - Create `backend/lambdas/common/` with shared utilities
  - Implement `env.py` for environment configuration and SSM parameter access
  - Implement `logging.py` for structured CloudWatch logging
  - Implement `response.py` for standardized API responses
  - _Requirements: 5.1, 5.2, 8.1, 8.4_

- [x] 2.2 Implement DynamoDB service layer
  - Create `common/dynamodb.py` with DynamoDBService class
  - Implement user management methods (get_user, create_user, update_user)
  - Implement subscription management methods (get_subscription, create_subscription)
  - Implement AI session storage methods (store_session, get_history)
  - _Requirements: 2.2, 5.1_

- [x] 2.3 Create data models and validation
  - Implement User, Subscription, and AISession dataclasses
  - Add validation methods and serialization helpers
  - Create exception classes for error handling
  - _Requirements: 2.2, 8.4_

- [ ]* 2.4 Write unit tests for common utilities
  - Create pytest tests for DynamoDB service methods
  - Create tests for data models and validation
  - Create tests for response helpers and error handling
  - _Requirements: 6.4_

- [x] 3. Implement authentication Lambda function
  - Migrate auth.ts functionality to Python
  - Implement user session management
  - Integrate with existing Cognito configuration
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 3.1 Create authentication handler
  - Implement `api/auth/handler.py` with session management
  - Handle getUser and createUser actions
  - Maintain compatibility with existing frontend auth flow
  - Add proper error handling and logging
  - _Requirements: 2.2, 2.5, 8.4_

- [x] 3.2 Configure authentication Lambda deployment
  - Create `requirements.txt` for auth function dependencies
  - Configure Terraform Lambda resource for auth handler
  - Set up IAM permissions for DynamoDB access
  - _Requirements: 2.1, 4.1, 4.2, 4.3_

- [ ]* 3.3 Write unit tests for authentication handler
  - Test user creation and retrieval functionality
  - Test error handling and validation
  - Mock DynamoDB interactions
  - _Requirements: 6.4_

- [x] 4. Implement Stripe payment processing Lambda functions
  - Migrate stripe.ts functionality to Python
  - Implement checkout session creation and webhook handling
  - Maintain existing Stripe integration patterns
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 4.1 Create Stripe checkout handler
  - Implement `api/stripe/handler.py` for checkout session creation
  - Handle priceId validation and session creation
  - Maintain compatibility with existing frontend Stripe integration
  - Add proper error handling for Stripe API calls
  - _Requirements: 2.2, 2.5, 8.4_

- [x] 4.2 Create Stripe webhook handler
  - Implement `api/stripe/webhook.py` for Stripe event processing
  - Handle checkout.session.completed and subscription events
  - Implement signature verification for webhook security
  - Update user subscription status in DynamoDB
  - _Requirements: 2.2, 2.5, 8.4_

- [x] 4.3 Configure Stripe Lambda deployments
  - Create `requirements.txt` files for Stripe functions
  - Configure Terraform Lambda resources for Stripe handlers
  - Set up IAM permissions for DynamoDB and SSM access
  - Configure SSM parameters for Stripe secrets
  - _Requirements: 2.1, 4.1, 4.2, 5.1, 5.2, 5.4_

- [ ]* 4.4 Write unit tests for Stripe handlers
  - Test checkout session creation with mock Stripe API
  - Test webhook event processing and signature verification
  - Test subscription status updates
  - _Requirements: 6.4_

- [x] 5. Implement subscription management Lambda function
  - Migrate subscription.ts functionality to Python
  - Implement subscription status retrieval
  - Maintain existing subscription checking patterns
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 5.1 Create subscription status handler
  - Implement `api/subscription/handler.py` for status retrieval
  - Handle user subscription status and active subscription checks
  - Maintain compatibility with existing frontend subscription gates
  - Add proper error handling and mock data for testing
  - _Requirements: 2.2, 2.5, 8.4_

- [x] 5.2 Configure subscription Lambda deployment
  - Create `requirements.txt` for subscription function
  - Configure Terraform Lambda resource for subscription handler
  - Set up IAM permissions for DynamoDB access
  - _Requirements: 2.1, 4.1, 4.2, 4.3_

- [ ]* 5.3 Write unit tests for subscription handler
  - Test subscription status retrieval
  - Test active subscription validation
  - Mock DynamoDB interactions
  - _Requirements: 6.4_

- [x] 6. Implement AI processing Lambda functions
  - Migrate ai.ts functionality to Python
  - Implement AWS Bedrock integration for AI generation
  - Implement AI session history management
  - _Requirements: 2.1, 2.2, 2.5, 9.3_

- [x] 6.1 Create AI generation handler
  - Implement `api/ai/handler.py` for AI model invocation
  - Integrate with AWS Bedrock for Claude model access
  - Handle prompt processing and response generation
  - Implement subscription validation for AI features
  - _Requirements: 2.2, 2.5, 9.3_

- [x] 6.2 Create AI history handler
  - Implement `api/ai/history.py` for session history retrieval
  - Store AI sessions in DynamoDB with proper data structure
  - Handle user-specific history queries
  - Add pagination support for large history sets
  - _Requirements: 2.2, 2.5, 9.3_

- [x] 6.3 Configure AI Lambda deployments
  - Create `requirements.txt` files for AI functions with boto3 dependencies
  - Configure Terraform Lambda resources for AI handlers
  - Set up IAM permissions for Bedrock and DynamoDB access
  - _Requirements: 2.1, 4.1, 4.2, 4.3, 9.3_

- [ ]* 6.4 Write unit tests for AI handlers
  - Test AI generation with mock Bedrock responses
  - Test session storage and history retrieval
  - Test subscription validation for AI features
  - _Requirements: 6.4_

- [x] 7. Implement S3 file upload functionality
  - Create presigned URL generation for secure uploads
  - Set up S3 bucket with proper security configuration
  - Prepare foundation for future file processing pipeline
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.1 Create S3 presigned URL handler
  - Implement `upload/presigned_url/handler.py` for URL generation
  - Handle secure presigned URL creation with expiration
  - Add file type validation and size limits
  - Implement proper error handling for S3 operations
  - _Requirements: 7.1, 7.2, 8.4_

- [x] 7.2 Configure S3 bucket and Lambda deployment
  - Create S3 bucket with versioning and optional KMS encryption
  - Configure Terraform Lambda resource for upload handler
  - Set up IAM permissions for S3 PutObject operations
  - Configure S3 event notifications for future processing
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [ ]* 7.3 Create placeholder file processing handler
  - Implement `upload/process/handler.py` as placeholder for future AI pipeline
  - Add TODO comments for document analysis and indexing
  - Set up basic S3 event handling structure
  - _Requirements: 9.4_

- [ ]* 7.4 Write unit tests for upload handlers
  - Test presigned URL generation with mock S3 client
  - Test file validation and error handling
  - Test S3 event processing structure
  - _Requirements: 6.4_

- [x] 8. Set up build system and deployment automation
  - Create Makefile for Lambda packaging and testing
  - Implement deterministic dependency management
  - Set up code formatting and linting tools
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8.1 Create build automation with Makefile
  - Implement `make build` target to create zip packages for all Lambda functions
  - Implement `make test` target to run pytest with coverage
  - Implement `make format` target for black and ruff formatting
  - Create `make clean` target to remove build artifacts
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 8.2 Set up dependency management
  - Create `requirements-dev.txt` with pytest, black, ruff, and moto
  - Implement pip-compile workflow for deterministic builds
  - Create individual `requirements.txt` files for each Lambda function
  - _Requirements: 6.3_

- [x] 8.3 Configure Lambda packaging process
  - Create build scripts to package Lambda functions with dependencies
  - Ensure zip artifacts are created in `backend/dist/` directory
  - Implement proper file permissions and structure in packages
  - _Requirements: 6.1, 6.5_

- [x] 9. Configure monitoring and logging infrastructure
  - Set up CloudWatch Logs for all Lambda functions
  - Create basic CloudWatch alarms for error monitoring
  - Implement structured logging across all handlers
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9.1 Configure CloudWatch Logs and alarms
  - Set up CloudWatch Log Groups for all Lambda functions in Terraform
  - Create CloudWatch alarms for 5XX error rates on API Gateway
  - Create CloudWatch alarms for Lambda function errors and duration
  - Configure log retention periods based on environment
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 9.2 Implement structured logging
  - Update all Lambda handlers to use structured logging format
  - Add request ID tracking and correlation across services
  - Implement proper log levels (DEBUG, INFO, WARN, ERROR)
  - _Requirements: 8.1, 8.4_

- [ ]* 9.3 Set up optional SQS queues for future scaling
  - Create SQS queue and DLQ resources in Terraform (commented/optional)
  - Add CloudWatch alarms for DLQ depth monitoring
  - Document integration points for future fan-out patterns
  - _Requirements: 8.3_

- [x] 10. Create environment configuration and documentation
  - Set up SSM Parameter Store for runtime configuration
  - Create comprehensive environment variable documentation
  - Update frontend configuration for new backend
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10.1 Configure SSM Parameter Store
  - Create SSM parameters for database table names and API URLs
  - Set up environment-specific parameter paths (/dev/, /staging/, /prod/)
  - Configure Terraform to create SSM parameters with proper values
  - Update Lambda functions to read from SSM at runtime
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10.2 Create environment configuration files
  - Update `.env.example` with new Terraform-based environment variables
  - Document all required environment variables for development
  - Create environment-specific configuration templates
  - _Requirements: 5.5_

- [x] 10.3 Update frontend configuration
  - Update Next.js environment variables to point to new API Gateway
  - Ensure CORS configuration matches frontend domains
  - Test frontend integration with new Python backend
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 11. Create comprehensive documentation and AI development context
  - Write architecture and context documentation
  - Create quick-start guides and development workflows
  - Set up steering files for AI agent development
  - _Requirements: 9.1, 9.2, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11.1 Create core documentation files
  - Write `docs/context/context.md` with product domain and vocabulary
  - Write `docs/architecture/architecture.md` with serverless flow and data contracts
  - Write `warp.md` with quick terminal commands for Terraform and build operations
  - Write `codex.md` with AI agent usage guidelines and entry points
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 11.2 Create steering files for AI development
  - Create `.kiro/steering/project_goals.md` with business goals and non-goals
  - Create `.kiro/steering/coding_standards.md` with Python, Terraform, and JS/TS standards
  - Create `.kiro/steering/security_checklist.md` with IAM, KMS, SSM, and PII guidelines
  - Create `.kiro/steering/review_checklist.md` with PR checklist and acceptance criteria
  - _Requirements: 9.1, 9.2, 9.5_

- [x] 11.3 Update README and migration documentation
  - Update main README with Terraform setup instructions
  - Document migration process and differences from SST
  - Add troubleshooting guide for common issues
  - Create deployment guide for different environments
  - _Requirements: 10.5_

- [x] 12. Validate complete system integration and deployment
  - Deploy infrastructure and test all endpoints
  - Validate frontend integration with new backend
  - Perform end-to-end testing of critical user flows
  - _Requirements: 1.1, 2.2, 3.2, 3.3, 3.4, 3.5_

- [x] 12.1 Deploy and validate infrastructure
  - Run `terraform init`, `terraform plan`, and `terraform apply`
  - Verify all AWS resources are created correctly
  - Test API Gateway endpoints and Lambda function invocations
  - Validate IAM permissions and security configurations
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12.2 Test complete user workflows
  - Test user authentication and session management
  - Test Stripe checkout and subscription workflows
  - Test AI generation and history features
  - Test file upload with presigned URLs
  - _Requirements: 2.2, 3.2, 3.3, 3.4, 3.5_

- [x] 12.3 Validate monitoring and logging
  - Verify CloudWatch Logs are capturing Lambda function logs
  - Test CloudWatch alarms with simulated errors
  - Validate structured logging format and correlation IDs
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_