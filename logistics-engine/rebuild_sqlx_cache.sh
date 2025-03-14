#!/bin/bash

# Script to rebuild the SQLx cache

# Ensure we're in the project directory
cd "$(dirname "$0")"

# Remove existing SQLx cache
rm -rf .sqlx

# Create empty directory
mkdir -p .sqlx

# Set offline mode to false
export SQLX_OFFLINE=false

# Clean the project to force a full rebuild
cargo clean

# Prepare the SQLx cache with database connection
cargo sqlx prepare -- --lib

echo "SQLx cache has been rebuilt." 