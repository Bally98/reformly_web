#!/bin/bash

# Deploy script for production server
# This script can be used manually or called from GitHub Actions

set -e  # Exit on error

echo "=== Starting deployment ==="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_DIR"

echo "=== Pulling latest changes from GitHub ==="
git pull origin main || git pull origin master

echo "=== Building and starting production containers ==="
make up-prod

echo "=== Deployment complete ==="
echo "Checking container status..."
make ps-prod




