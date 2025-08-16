#!/bin/bash

# Simple SaaS Template Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
STAGE="dev"
SKIP_BUILD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --stage)
      STAGE="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --stage STAGE     Deploy to specific stage (default: dev)"
      echo "  --skip-build      Skip the build step"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🚀 Deploying Simple SaaS Template to stage: ${STAGE}${NC}"

# Check if required environment variables are set for production
if [ "$STAGE" = "production" ]; then
  echo -e "${YELLOW}⚠️  Production deployment detected. Checking environment variables...${NC}"
  
  if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY is required for production deployment${NC}"
    exit 1
  fi
  
  if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET is required for production deployment${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Environment variables check passed${NC}"
fi

# Build the application if not skipped
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}📦 Building application...${NC}"
  npm run build
  echo -e "${GREEN}✅ Build completed${NC}"
fi

# Deploy with SST
echo -e "${YELLOW}🏗️  Deploying infrastructure and application...${NC}"
npx sst deploy --stage "$STAGE"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update your .env.local with the deployed API URL"
echo "2. Configure your Stripe webhook endpoints"
echo "3. Test the application"

if [ "$STAGE" = "production" ]; then
  echo -e "${YELLOW}⚠️  Production deployment notes:${NC}"
  echo "- Make sure to configure your custom domain"
  echo "- Set up monitoring and alerting"
  echo "- Review security settings"
fi