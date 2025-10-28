#!/bin/bash
# Build script for Python Lambda functions
# This script provides an alternative to the Makefile for CI/CD environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DIST_DIR="dist"
PYTHON_VERSION="3.11"

echo -e "${BLUE}Starting Lambda build process...${NC}"

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${BLUE}Python version: ${python_version}${NC}"

# Create dist directory
echo -e "${YELLOW}Creating dist directory...${NC}"
mkdir -p ${DIST_DIR}

# Function to package a Lambda
package_lambda() {
    local lambda_name=$1
    local lambda_dir=$2
    local handler_file=$3
    
    echo -e "${BLUE}Packaging ${lambda_name}...${NC}"
    
    # Create temporary directory
    temp_dir="${DIST_DIR}/${lambda_name}_temp"
    mkdir -p ${temp_dir}
    
    # Copy common utilities
    cp -r lambdas/common ${temp_dir}/
    
    # Copy Lambda-specific files
    cp ${lambda_dir}/${handler_file} ${temp_dir}/
    if [ -f "${lambda_dir}/__init__.py" ]; then
        cp ${lambda_dir}/__init__.py ${temp_dir}/
    fi
    
    # Install dependencies if requirements.txt exists
    if [ -f "${lambda_dir}/requirements.txt" ]; then
        echo -e "  Installing dependencies for ${lambda_name}..."
        pip3 install -r ${lambda_dir}/requirements.txt -t ${temp_dir}/ --no-deps --quiet
    fi
    
    # Create zip package
    cd ${temp_dir}
    zip -r ../${lambda_name}.zip . -q
    cd - > /dev/null
    
    # Clean up temp directory
    rm -rf ${temp_dir}
    
    echo -e "  ${GREEN}✓ Created ${DIST_DIR}/${lambda_name}.zip${NC}"
}

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf ${DIST_DIR}/*.zip

# Package all Lambda functions
package_lambda "auth" "lambdas/api/auth" "handler.py"
package_lambda "stripe-checkout" "lambdas/api/stripe" "handler.py"
package_lambda "stripe-webhook" "lambdas/api/stripe" "webhook.py"
package_lambda "subscription" "lambdas/api/subscription" "handler.py"
package_lambda "ai-generate" "lambdas/api/ai" "handler.py"
package_lambda "ai-history" "lambdas/api/ai" "history.py"
package_lambda "upload-url" "lambdas/upload/presigned_url" "handler.py"

# Show package information
echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${BLUE}Generated packages:${NC}"
ls -la ${DIST_DIR}/*.zip

# Show package sizes
echo -e "${BLUE}Package sizes:${NC}"
for zip in ${DIST_DIR}/*.zip; do
    if [ -f "$zip" ]; then
        size=$(du -h "$zip" | cut -f1)
        echo -e "  $(basename $zip): $size"
    fi
done

echo -e "${GREEN}All Lambda functions packaged successfully!${NC}"