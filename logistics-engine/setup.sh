#!/bin/bash

# Setup script for Logistics Engine

set -e  # Exit on any error

function print_header() {
    echo -e "\n\033[1;34m===== $1 =====\033[0m\n"
}

# Check prerequisites
print_header "Checking prerequisites"

if ! command -v cargo &> /dev/null; then
    echo "Rust/Cargo is not installed. Please install Rust from https://rustup.rs/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Setup environment
print_header "Setting up environment"
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo ".env file created. Please edit it with your configuration if needed."
else
    echo ".env file already exists."
fi

# Start infrastructure services with Docker Compose
print_header "Starting infrastructure services"
echo "Starting PostgreSQL, RabbitMQ, and Jaeger..."
docker compose up -d

# Wait for PostgreSQL to be ready
print_header "Waiting for PostgreSQL to be ready"
max_attempts=30
attempt=0
until docker exec logistics-engine-postgres pg_isready -U logistics || [ $attempt -eq $max_attempts ]; do
    echo "Waiting for PostgreSQL to be ready... ($((attempt+1))/$max_attempts)"
    attempt=$((attempt+1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "PostgreSQL did not become ready in time. Please check the Docker logs."
    exit 1
fi

# Build the project
print_header "Building the project"
cargo build

# Run database migrations
print_header "Running database migrations"
echo "This will set up the database schema..."
cargo run --bin migrate

# Display running services
print_header "Services running"
echo "PostgreSQL: localhost:5432"
echo "RabbitMQ: localhost:5672 (AMQP), localhost:15672 (Management UI)"
echo "Jaeger UI: http://localhost:16686"

# Instructions to run the application
print_header "Run the application"
echo "You can now run the Logistics Engine with:"
echo "cargo run"
echo "The service will be available at http://localhost:8080" 