#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Build and run tests in Docker
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up \
    --abort-on-container-exit \
    --exit-code-from test-app

# Clean up
docker-compose -f docker-compose.test.yml down -v 