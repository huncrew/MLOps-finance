#!/bin/bash

# MLOps Lambda Functions Build Script
# This script packages all MLOps Lambda functions for deployment

set -e

echo "🚀 Building MLOps Lambda Functions..."

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
    cp "$source_file" "$temp_dir/handler.py"
    
    # Create requirements.txt for this function
    cat > "$temp_dir/requirements.txt" << EOF
boto3>=1.26.0
botocore>=1.29.0
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

# Build all MLOps Lambda functions
echo "🔧 Building MLOps Lambda functions..."

# KB Processor
build_lambda "KB Processor" \
    "backend/lambdas/api/mlops/kb_processor.py" \
    "$(pwd)/backend/dist/kb-processor.zip"

# KB Handler
build_lambda "KB Handler" \
    "backend/lambdas/api/mlops/kb_handler.py" \
    "$(pwd)/backend/dist/kb-handler.zip"

# Document Analyzer
build_lambda "Document Analyzer" \
    "backend/lambdas/api/mlops/document_analyzer.py" \
    "$(pwd)/backend/dist/document-analyzer.zip"

# Analysis Handler
build_lambda "Analysis Handler" \
    "backend/lambdas/api/mlops/analysis_handler.py" \
    "$(pwd)/backend/dist/analysis-handler.zip"

# RAG Processor
build_lambda "RAG Processor" \
    "backend/lambdas/api/mlops/rag_processor.py" \
    "$(pwd)/backend/dist/rag-processor.zip"

# RAG Handler
build_lambda "RAG Handler" \
    "backend/lambdas/api/mlops/rag_handler.py" \
    "$(pwd)/backend/dist/rag-handler.zip"

# Health Handler
build_lambda "Health Handler" \
    "backend/lambdas/api/mlops/health_handler.py" \
    "$(pwd)/backend/dist/mlops-health.zip"

echo "🎉 All MLOps Lambda functions built successfully!"
echo "📁 Build artifacts available in backend/dist/"

# List built files
echo "📋 Built files:"
ls -la backend/dist/*.zip | grep -E "(kb-|document-|analysis-|rag-|mlops-health)"

echo "✨ MLOps Lambda build complete!"
