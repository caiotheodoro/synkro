#!/bin/bash

# Set the working directory
cd "$(dirname "$0")/.."

# Ensure the test database is set up
echo "Setting up test database..."
DB_NAME="inventory_test"

# Create a test-specific .env.test file
cat <<EOT > .env.test
ENV=test
GRPC_PORT=:50053
HTTP_PORT=:8081
JWT_SECRET=test-secret-key

# Database - using existing PostgreSQL container
DB_HOST=localhost
DB_PORT=5433
DB_USER=logistics
DB_PASSWORD=logistics_password
DB_NAME=$DB_NAME
DB_SSL_MODE=disable

# Skip tests that require external services
SKIP_E2E_TESTS=true
SKIP_LOGISTICS_ENGINE_TEST=true
EOT

# Create the test database if it doesn't exist
export PGPASSWORD=logistics_password
psql -h localhost -U logistics -p 5433 -d logistics_engine -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || psql -h localhost -U logistics -p 5433 -d logistics_engine -c "CREATE DATABASE $DB_NAME"

# Run the tests with verbose output
echo "Running integration tests..."
go test -v ./tests/...

# Clean up
echo "Cleaning up..."
# Uncomment to drop the test database after tests
# psql -h localhost -U logistics -p 5433 -d logistics_engine -c "DROP DATABASE $DB_NAME"

echo "Integration tests completed." 