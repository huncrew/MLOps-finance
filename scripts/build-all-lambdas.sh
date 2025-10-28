#!/bin/bash

# Complete Lambda Functions Build Script
# This script packages ALL Lambda functions for deployment

set -e

echo "🚀 Building ALL Lambda Functions..."

# Create dist directory if it doesn't exist
mkdir -p backend/dist

# Function to build a Lambda function
build_lambda() {
    local function_name=$1
    local source_file=$2
    local output_file=$3
    
    echo "📦 Building $function_name..."
    
    # Create temporary directory
    temp_dir=$(mktemp -d)
    
    # Copy source files
    cp -r backend/lambdas/common "$temp_dir/"
    
    # Check if source file exists
    if [ ! -f "$source_file" ]; then
        echo "⚠️  Source file $source_file not found, skipping $function_name"
        rm -rf "$temp_dir"
        return
    fi
    
    cp "$source_file" "$temp_dir/handler.py"
    
    # Create requirements.txt for this function
    cat > "$temp_dir/requirements.txt" << EOF
boto3>=1.26.0
botocore>=1.29.0
numpy>=1.21.0
EOF
    
    # Install dependencies if requirements.txt exists
    if [ -f "$temp_dir/requirements.txt" ]; then
        echo "📥 Installing dependencies for $function_name..."
        pip install -r "$temp_dir/requirements.txt" -t "$temp_dir/" --quiet
    fi
    
    # Create zip file
    cd "$temp_dir"
    zip -r "$output_file" . -q
    cd - > /dev/null
    
    # Clean up
    rm -rf "$temp_dir"
    
    echo "✅ $function_name built successfully"
}

# Build all Lambda functions
echo "🔧 Building all Lambda functions..."

# Auth Lambda
build_lambda "Auth" \
    "backend/lambdas/api/auth/handler.py" \
    "$(pwd)/backend/dist/auth.zip"

# AI Generate Lambda
build_lambda "AI Generate" \
    "backend/lambdas/api/ai/handler.py" \
    "$(pwd)/backend/dist/ai-generate.zip"

# AI History Lambda
build_lambda "AI History" \
    "backend/lambdas/api/ai/history.py" \
    "$(pwd)/backend/dist/ai-history.zip"

# Stripe Checkout Lambda
build_lambda "Stripe Checkout" \
    "backend/lambdas/api/stripe/handler.py" \
    "$(pwd)/backend/dist/stripe-checkout.zip"

# Stripe Webhook Lambda
build_lambda "Stripe Webhook" \
    "backend/lambdas/api/stripe/webhook.py" \
    "$(pwd)/backend/dist/stripe-webhook.zip"

# Subscription Lambda
build_lambda "Subscription" \
    "backend/lambdas/api/subscription/handler.py" \
    "$(pwd)/backend/dist/subscription.zip"

# Upload URL Lambda
build_lambda "Upload URL" \
    "backend/lambdas/upload/presigned_url/handler.py" \
    "$(pwd)/backend/dist/upload-url.zip"

# MLOps Lambda Functions
build_lambda "KB Processor" \
    "backend/lambdas/api/mlops/kb_processor.py" \
    "$(pwd)/backend/dist/kb-processor.zip"

build_lambda "KB Handler" \
    "backend/lambdas/api/mlops/kb_handler.py" \
    "$(pwd)/backend/dist/kb-handler.zip"

build_lambda "Document Analyzer" \
    "backend/lambdas/api/mlops/document_analyzer.py" \
    "$(pwd)/backend/dist/document-analyzer.zip"

build_lambda "Analysis Handler" \
    "backend/lambdas/api/mlops/analysis_handler.py" \
    "$(pwd)/backend/dist/analysis-handler.zip"

build_lambda "RAG Processor" \
    "backend/lambdas/api/mlops/rag_processor.py" \
    "$(pwd)/backend/dist/rag-processor.zip"

build_lambda "RAG Handler" \
    "backend/lambdas/api/mlops/rag_handler.py" \
    "$(pwd)/backend/dist/rag-handler.zip"

build_lambda "Health Handler" \
    "backend/lambdas/api/mlops/health_handler.py" \
    "$(pwd)/backend/dist/mlops-health.zip"

echo "🎉 All Lambda functions built successfully!"
echo "📁 Build artifacts available in backend/dist/"

# List built files
echo "📋 Built files:"
ls -la backend/dist/*.zip

echo "✨ Complete Lambda build finished!"