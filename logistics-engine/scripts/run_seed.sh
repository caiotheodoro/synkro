#!/bin/bash

# Get database connection parameters from environment or use defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_NAME=${DB_NAME:-logistics_engine}
DB_USER=${DB_USER:-logistics}

# Run the seed file
psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f seed.sql

echo "Seed completed successfully!" 
