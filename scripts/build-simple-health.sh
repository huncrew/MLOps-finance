#!/bin/bash

# Build simple health handler
set -e

echo "🚀 Building simple health handler..."

# Get current directory
CURRENT_DIR=$(pwd)

# Create temporary directory
temp_dir=$(mktemp -d)

# Copy just the simple health file
cp backend/lambdas/api/mlops/simple_health.py "$temp_dir/handler.py"

# Create zip file
cd "$temp_dir"
zip -r "$CURRENT_DIR/backend/dist/mlops-health.zip" . -q
cd "$CURRENT_DIR"

# Clean up
rm -rf "$temp_dir"

echo "✅ Simple health handler built successfully"