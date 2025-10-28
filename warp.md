# Warp Quickstart

Quick commands for Warp terminal to work with the Terraform + Python SaaS template.

## Infrastructure Commands

```bash
# Initialize Terraform
npm run infra:init

# Plan infrastructure changes
npm run infra:plan

# Apply infrastructure
npm run infra:apply

# Get infrastructure outputs
cd infra/terraform && terraform output

# Destroy infrastructure (careful!)
npm run infra:destroy

# Validate configuration
npm run infra:validate
```

## Backend Development

```bash
# Build all Lambda functions
npm run backend:build

# Run tests
npm run backend:test

# Format code
npm run backend:format

# Lint code
npm run backend:lint

# Clean build artifacts
npm run backend:clean
```

## Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Set up Terraform variables
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars

# Install backend dependencies
cd backend && pip install -r requirements-dev.txt
```

## Deployment Workflow

```bash
# 1. Prepare deployment (build + validate)
npm run deploy:prep

# 2. Deploy infrastructure
npm run deploy

# 3. Get API Gateway URL
cd infra/terraform && terraform output api_gateway_url

# 4. Set Stripe secrets in SSM
aws ssm put-parameter --name "/simple-saas-template/dev/stripe/secret-key" --value "sk_test_..." --type "SecureString" --overwrite
aws ssm put-parameter --name "/simple-saas-template/dev/stripe/webhook-secret" --value "whsec_..." --type "SecureString" --overwrite
```

## Development Workflow

```bash
# Start frontend development
npm run dev

# Watch backend changes (rebuild on change)
cd backend && make build && echo "Backend updated"

# Test API endpoints
cd backend && python -m pytest tests/ -v

# Check infrastructure
cd infra/terraform && terraform plan
```

## Monitoring and Debugging

```bash
# View Lambda logs
aws logs tail /aws/lambda/simple-saas-template-dev-auth --follow

# Check API Gateway logs
aws logs tail /aws/apigateway/simple-saas-template-dev --follow

# View CloudWatch dashboard
aws cloudwatch get-dashboard --dashboard-name simple-saas-template-dev-dashboard

# Check DynamoDB table
aws dynamodb scan --table-name simple-saas-template-dev-database --max-items 10
```

## Useful Aliases

Add these to your shell profile for faster development:

```bash
# Terraform shortcuts
alias tf="terraform"
alias tfi="terraform init"
alias tfp="terraform plan"
alias tfa="terraform apply"
alias tfo="terraform output"

# Backend shortcuts
alias be="cd backend"
alias build="cd backend && make build"
alias test="cd backend && make test"
alias fmt="cd backend && make format"

# Combined workflows
alias deploy="cd backend && make build && cd ../infra/terraform && terraform apply"
alias logs="aws logs tail /aws/lambda/simple-saas-template-dev-auth --follow"
```