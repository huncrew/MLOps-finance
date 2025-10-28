#!/bin/bash

# Quick build for health handler without pip dependencies
set -e

echo "🚀 Quick building health handler..."

# Get current directory
CURRENT_DIR=$(pwd)

# Create temporary directory
temp_dir=$(mktemp -d)

# Copy source files
cp -r backend/lambdas/common "$temp_dir/"
cp backend/lambdas/api/mlops/health_handler.py "$temp_dir/handler.py"

# Create zip file
cd "$temp_dir"
zip -r "$CURRENT_DIR/backend/dist/mlops-health.zip" . -q
cd "$CURRENT_DIR"

# Clean up
rm -rf "$temp_dir"

echo "✅ Health handler built successfully"