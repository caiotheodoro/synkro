#!/bin/bash

# Run all migration files in order
echo "Running migrations..."

# Create tables and initial schema
psql -U logistics -h localhost -p 5433 -d logistics_engine -f migrations/20240304000000_create_tables.sql

# Fix schema issues
psql -U logistics -h localhost -p 5433 -d logistics_engine -f migrations/20240306000000_fix_schema.sql
psql -U logistics -h localhost -p 5433 -d logistics_engine -f migrations/20240306000000_fix_schema_2.sql

# Check if migrations were successful
if [ $? -eq 0 ]; then
    echo "Migrations completed successfully!"
else
    echo "Error: Migrations failed!"
    exit 1
fi 
