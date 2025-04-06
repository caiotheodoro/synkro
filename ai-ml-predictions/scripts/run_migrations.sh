#!/bin/bash

# Get database connection parameters from environment or use defaults
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5434}
DB_NAME=${POSTGRES_DB:-ai_ml_predictions}
DB_USER=${POSTGRES_USER:-logistics}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}

echo "Running migrations..."

# Create database if it doesn't exist
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

cd "$(dirname "$0")/../" && echo "Current path: $(pwd)" && \
if [ -f app/migrations/create_tables.sql ]; then \
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f app/migrations/create_tables.sql; \
else \
  echo "Migration file not found: app/migrations/create_tables.sql"; \
  exit 1; \
fi

echo "Migrations completed successfully!" 