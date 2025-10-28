# Agent Usage

Guidelines for AI agents working with this project.

## Project Overview

We write clean code with:
- **Backend**: Python
- **Frontend**: React
- **Infrastructure**: Terraform for deployment

## Context & Prompts

You will receive context and prompts to guide your work. Starting project context and architecture can be found in the `docs/` directory and should be referenced as needed.

## Primary Entry Points

### Backend Lambda Functions
- `backend/lambdas/api/*/handler.py` - Main Lambda function handlers
- `backend/lambdas/common/` - Shared utilities and services
- `backend/Makefile` - Build and deployment automation

### Infrastructure Configuration
- `infra/terraform/main.tf` - Root Terraform configuration
- `infra/terraform/modules/` - Reusable Terraform modules
- `infra/terraform/variables.tf` - Configuration variables

### Frontend Integration
- `.env.example` - Environment variable template
- `frontend/` - Next.js frontend application

## Context Files to Load

When working on this repository, always load these context files first:

1. **docs/context/context.md** - Business domain and vocabulary
2. **docs/architecture/architecture.md** - Technical architecture and data flows
3. **backend/lambdas/common/models.py** - Data models and validation
4. **infra/terraform/main.tf** - Infrastructure configuration

## Development Practices

- **Clean code**: Write clear, maintainable code following best practices
- **Type hints**: Use Python type hints for better code clarity
- **Error Handling**: Implement proper try/catch with appropriate exception types
- **Logging**: Use structured logging with correlation IDs
- **Testing**: Write unit tests for business logic
- **Real AWS integrations**: Avoid using mock data - focus on real, live AWS integrations and tests
