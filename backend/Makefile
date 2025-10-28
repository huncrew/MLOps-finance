# Makefile for Python Lambda functions
# Provides build, test, and deployment automation

.PHONY: help build test format lint clean install-dev package-all
.DEFAULT_GOAL := help

# Configuration
PYTHON := python3
PIP := pip3
DIST_DIR := dist
LAMBDA_DIRS := $(shell find lambdas -name "handler.py" -o -name "webhook.py" -o -name "history.py" | xargs dirname | sort | uniq)
COMMON_DIR := lambdas/common

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Available targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-dev: ## Install development dependencies
	@echo "$(YELLOW)Installing development dependencies...$(NC)"
	$(PIP) install -r requirements-dev.txt

build: clean package-all ## Build all Lambda function packages
	@echo "$(GREEN)Build completed successfully!$(NC)"
	@echo "$(BLUE)Generated packages:$(NC)"
	@ls -la $(DIST_DIR)/*.zip

package-all: $(DIST_DIR) ## Package all Lambda functions
	@echo "$(YELLOW)Packaging Lambda functions...$(NC)"
	@$(MAKE) package-auth
	@$(MAKE) package-stripe-checkout
	@$(MAKE) package-stripe-webhook
	@$(MAKE) package-subscription
	@$(MAKE) package-ai-generate
	@$(MAKE) package-ai-history
	@$(MAKE) package-upload-url

package-auth: ## Package authentication Lambda
	@echo "$(BLUE)Packaging auth Lambda...$(NC)"
	@$(MAKE) package-lambda LAMBDA_NAME=auth LAMBDA_DIR=lambdas/api/auth HANDLER=handler.py

package-stripe-checkout: ## Package Stripe checkout Lambda
	@echo "$(BLUE)Packaging stripe-checkout Lambda...$(NC)"
	@$(MAKE) package-lambda LAMBDA_NAME=stripe-checkout LAMBDA_DIR=lambdas/api/stripe HANDLER=handler.py

package-stripe-webhook: ## Package Stripe webhook Lambda
	@echo "$(BLUE)Packaging stripe-webhook Lambda...$(NC)"
	@$(MAKE) package-lambda LAMBDA_NAME=stripe-webhook LAMBDA_DIR=lambdas/api/stripe HANDLER=webhook.py

package-subscription: ## Package subscription Lambda
	@echo "$(BLUE)Packaging subscription Lambda...$(NC)"
	@$(MAKE) package-lambda LAMBDA_NAME=subscription LAMBDA_DIR=lambdas/api/subscription HANDLER=handler.py

package-ai-generate: ## Package AI generation Lambda
	@echo "$(BLUE)Packaging ai-generate Lambda...$(NC)"
	@$(MAKE) package-lambda LAMBDA_NAME=ai-generate LAMBDA_DIR=lambdas/api/ai HANDLER=handler.py

package-ai-history: ## Package AI history Lambda
	@echo "$(BLUE)Packaging ai-history Lambda...$(NC)"
	@$(MAKE) package-lambda LAMBDA_NAME=ai-history LAMBDA_DIR=lambdas/api/ai HANDLER=history.py

package-upload-url: ## Package upload URL Lambda
	@echo "$(BLUE)Packaging upload-url Lambda...$(NC)"
	@$(MAKE) package-lambda LAMBDA_NAME=upload-url LAMBDA_DIR=lambdas/upload/presigned_url HANDLER=handler.py

package-lambda: ## Package a single Lambda function (internal target)
	@if [ -z "$(LAMBDA_NAME)" ] || [ -z "$(LAMBDA_DIR)" ] || [ -z "$(HANDLER)" ]; then \
		echo "$(RED)Error: LAMBDA_NAME, LAMBDA_DIR, and HANDLER must be specified$(NC)"; \
		exit 1; \
	fi
	@echo "  Creating package for $(LAMBDA_NAME)..."
	@mkdir -p $(DIST_DIR)/$(LAMBDA_NAME)
	
	# Copy common utilities
	@cp -r $(COMMON_DIR) $(DIST_DIR)/$(LAMBDA_NAME)/
	
	# Copy Lambda-specific files
	@cp $(LAMBDA_DIR)/$(HANDLER) $(DIST_DIR)/$(LAMBDA_NAME)/
	@if [ -f "$(LAMBDA_DIR)/__init__.py" ]; then cp $(LAMBDA_DIR)/__init__.py $(DIST_DIR)/$(LAMBDA_NAME)/; fi
	
	# Install dependencies if requirements.txt exists
	@if [ -f "$(LAMBDA_DIR)/requirements.txt" ]; then \
		echo "  Installing dependencies for $(LAMBDA_NAME)..."; \
		$(PIP) install -r $(LAMBDA_DIR)/requirements.txt -t $(DIST_DIR)/$(LAMBDA_NAME)/ --no-deps; \
	fi
	
	# Create zip package
	@cd $(DIST_DIR)/$(LAMBDA_NAME) && zip -r ../$(LAMBDA_NAME).zip . -q
	@rm -rf $(DIST_DIR)/$(LAMBDA_NAME)
	@echo "  ✓ Created $(DIST_DIR)/$(LAMBDA_NAME).zip"

test: ## Run all tests
	@echo "$(YELLOW)Running tests...$(NC)"
	@if [ -d "tests" ]; then \
		$(PYTHON) -m pytest tests/ -v --tb=short; \
	else \
		echo "$(YELLOW)No tests directory found. Skipping tests.$(NC)"; \
	fi

test-unit: ## Run unit tests only
	@echo "$(YELLOW)Running unit tests...$(NC)"
	@if [ -d "tests/unit" ]; then \
		$(PYTHON) -m pytest tests/unit/ -v; \
	else \
		echo "$(YELLOW)No unit tests found. Skipping.$(NC)"; \
	fi

test-integration: ## Run integration tests only
	@echo "$(YELLOW)Running integration tests...$(NC)"
	@if [ -d "tests/integration" ]; then \
		$(PYTHON) -m pytest tests/integration/ -v; \
	else \
		echo "$(YELLOW)No integration tests found. Skipping.$(NC)"; \
	fi

test-coverage: ## Run tests with coverage report
	@echo "$(YELLOW)Running tests with coverage...$(NC)"
	@if [ -d "tests" ]; then \
		$(PYTHON) -m pytest tests/ --cov=lambdas --cov-report=html --cov-report=term; \
		echo "$(GREEN)Coverage report generated in htmlcov/$(NC)"; \
	else \
		echo "$(YELLOW)No tests directory found. Skipping coverage.$(NC)"; \
	fi

lint: ## Run linting checks
	@echo "$(YELLOW)Running linting checks...$(NC)"
	@echo "  Checking with ruff..."
	@ruff check lambdas/ || echo "$(RED)Ruff found issues$(NC)"
	@echo "  Checking with black..."
	@black --check lambdas/ || echo "$(RED)Black formatting issues found$(NC)"
	@echo "$(GREEN)Linting completed$(NC)"

format: ## Format code with black and fix with ruff
	@echo "$(YELLOW)Formatting code...$(NC)"
	@echo "  Formatting with black..."
	@black lambdas/
	@echo "  Fixing with ruff..."
	@ruff --fix lambdas/ || true
	@echo "$(GREEN)Code formatting completed$(NC)"

validate: ## Validate Python syntax
	@echo "$(YELLOW)Validating Python syntax...$(NC)"
	@find lambdas/ -name "*.py" -exec $(PYTHON) -m py_compile {} \;
	@echo "$(GREEN)Syntax validation completed$(NC)"

clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf $(DIST_DIR)
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf htmlcov/ .coverage .pytest_cache/
	@echo "$(GREEN)Cleanup completed$(NC)"

$(DIST_DIR): ## Create dist directory
	@mkdir -p $(DIST_DIR)

# Development helpers
dev-setup: install-dev ## Set up development environment
	@echo "$(GREEN)Development environment setup completed$(NC)"

check-deps: ## Check if all dependencies are installed
	@echo "$(YELLOW)Checking dependencies...$(NC)"
	@$(PYTHON) -c "import boto3, botocore; print('✓ AWS SDK available')" || echo "$(RED)✗ AWS SDK not available$(NC)"
	@$(PYTHON) -c "import pytest; print('✓ pytest available')" || echo "$(RED)✗ pytest not available$(NC)"
	@$(PYTHON) -c "import black; print('✓ black available')" || echo "$(RED)✗ black not available$(NC)"
	@$(PYTHON) -c "import ruff; print('✓ ruff available')" || echo "$(RED)✗ ruff not available$(NC)"

# Terraform helpers
tf-init: ## Initialize Terraform
	@echo "$(YELLOW)Initializing Terraform...$(NC)"
	@cd ../infra/terraform && terraform init

tf-plan: ## Run Terraform plan
	@echo "$(YELLOW)Running Terraform plan...$(NC)"
	@cd ../infra/terraform && terraform plan

tf-apply: ## Apply Terraform configuration
	@echo "$(YELLOW)Applying Terraform configuration...$(NC)"
	@cd ../infra/terraform && terraform apply

tf-destroy: ## Destroy Terraform infrastructure
	@echo "$(RED)Destroying Terraform infrastructure...$(NC)"
	@cd ../infra/terraform && terraform destroy

# Combined workflows
deploy-prep: clean build validate ## Prepare for deployment (clean, build, validate)
	@echo "$(GREEN)Deployment preparation completed$(NC)"

ci: lint test ## Run CI checks (lint and test)
	@echo "$(GREEN)CI checks completed$(NC)"

# Show package sizes
package-info: ## Show information about built packages
	@if [ -d "$(DIST_DIR)" ]; then \
		echo "$(BLUE)Package Information:$(NC)"; \
		for zip in $(DIST_DIR)/*.zip; do \
			if [ -f "$$zip" ]; then \
				size=$$(du -h "$$zip" | cut -f1); \
				echo "  $$(basename $$zip): $$size"; \
			fi; \
		done; \
	else \
		echo "$(YELLOW)No packages found. Run 'make build' first.$(NC)"; \
	fi