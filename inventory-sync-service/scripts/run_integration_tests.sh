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

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=$DB_NAME
DB_SSL_MODE=disable
EOT

# Create the test database if it doesn't exist
export PGPASSWORD=postgres
psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || psql -h localhost -U postgres -c "CREATE DATABASE $DB_NAME"

# Run the tests with verbose output
echo "Running integration tests..."
go test -v ./tests/...

# Clean up
echo "Cleaning up..."
# Uncomment to drop the test database after tests
# psql -h localhost -U postgres -c "DROP DATABASE $DB_NAME"

echo "Integration tests completed." 