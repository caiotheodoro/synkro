# Logistics Engine

A high-performance logistics management service built in Rust, providing order management, inventory tracking, and shipping coordination.

## Features

- Order management
- Inventory tracking
- Payment processing
- Shipping coordination
- Customer management
- Real-time event processing with RabbitMQ
- gRPC APIs for high-performance service-to-service communication
- REST APIs for external integrations
- Observability with structured logging and Jaeger tracing

## Prerequisites

- Rust 1.70+ and Cargo
- Docker and Docker Compose
- PostgreSQL (or use the provided Docker Compose setup)
- RabbitMQ (or use the provided Docker Compose setup)

## Quick Start

### 1. Set up the environment

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/your-org/logistics-engine.git
cd logistics-engine
```

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file to match your desired configuration.

### 2. Start the required services

Start the PostgreSQL database, RabbitMQ, and monitoring tools using Docker Compose:

```bash
docker compose up -d
```

This will start:
- PostgreSQL database on port 5432
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)
- Jaeger on port 16686 (UI)

### 3. Build and run the application

Build the project:

```bash
cargo build
```

Run the migrations to set up the database schema:

```bash
cargo run --bin migrate
```

Run the application:

```bash
cargo run
```

By default, the service will start on port 8080.

## Development

### Running tests

Run all tests:

```bash
cargo test
```

Run a specific test:

```bash
cargo test test_name
```

### Database Migrations

Create a new migration:

```bash
cargo run --bin create_migration migration_name
```

Run pending migrations:

```bash
cargo run --bin migrate
```

Revert the last migration:

```bash
cargo run --bin rollback
```

### API Documentation

The API documentation is available at:
- REST API: http://localhost:8080/swagger-ui/
- gRPC API: The protobuf definitions are in the `proto/` directory

### Monitoring

- Jaeger UI: http://localhost:16686

## Docker

Build the Docker image:

```bash
docker build -t logistics-engine .
```

Run the container:

```bash
docker run -p 8080:8080 --env-file .env logistics-engine
```

## Deployment

The project includes Kubernetes manifests in the project root for deployment to a Kubernetes cluster:

```bash
kubectl apply -f k8s-deployment.yaml
kubectl apply -f k8s-ingress.yaml
```

## Project Structure

- `src/api` - REST API handlers
- `src/config` - Configuration management
- `src/db` - Database connections and utilities
- `src/models` - Data models and DTOs
- `src/services` - Business logic and service implementations
- `src/grpc` - gRPC server and client implementations
- `src/utils` - Utility functions and helpers
- `proto/` - Protocol Buffer definitions for gRPC services
- `migrations/` - SQL migrations for database schema

## Environment Variables

See `.env.example` for all available environment variables and their descriptions.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 