# Logistics Engine

A comprehensive backend service for logistics management, built with Rust, Axum, and PostgreSQL.

## Overview

Logistics Engine is a high-performance, scalable backend service designed to handle the complexities of modern logistics operations. It provides a robust API for managing customers, warehouses, inventory, orders, payments, and shipping.

## Features

- **Customer Management**: Create, read, update, and delete customer records
- **Warehouse Management**: Track warehouse information and capacity
- **Inventory Management**: Manage inventory items, track quantities, and handle reservations
- **Order Processing**: Process orders with line items, status tracking, and customer association
- **Payment Handling**: Process and track payments for orders with various payment methods
- **Shipping Management**: Create and track shipments with multiple carrier options and delivery status

## Tech Stack

- **Language**: Rust
- **Web Framework**: Axum
- **Database**: PostgreSQL with SQLx for async database operations
- **Authentication**: JWT-based authentication
- **Configuration**: Environment variables with dotenv support
- **Logging**: Tracing for structured logging
- **Error Handling**: Custom error types with proper HTTP status code mapping
- **Validation**: Input validation at DTO level
- **Documentation**: API documentation using OpenAPI spec

## Project Structure

```
logistics-engine/
├── src/
│   ├── api/               # API layer with routes, handlers, middleware
│   ├── config/            # Configuration management
│   ├── db/                # Database layer with repositories
│   ├── error/             # Error types and handling
│   ├── models/            # Data models and DTOs
│   ├── services/          # Business logic
│   └── main.rs            # Application entry point
├── migrations/            # Database migrations
├── tests/                 # Integration tests
├── Cargo.toml             # Project dependencies
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Rust (latest stable version)
- PostgreSQL 13+
- Docker (optional, for containerized deployment)

### Environment Setup

Create a `.env` file in the project root with the following variables:

```
# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
NODE_ENV=development
REQUEST_TIMEOUT_SECONDS=30
GRACEFUL_SHUTDOWN_SECONDS=10

# Database
DATABASE_URL=postgres://username:password@localhost:5433/logistics
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=1
DB_TIMEOUT_SECONDS=30
DATABASE_CONNECT_TIMEOUT_SECONDS=30
DATABASE_IDLE_TIMEOUT_SECONDS=600
DATABASE_MAX_LIFETIME_SECONDS=1800

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRATION=86400

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/%2f
RABBITMQ_ORDER_EXCHANGE=order_events
RABBITMQ_ORDER_QUEUE=order_processing
RABBITMQ_RETRY_ATTEMPTS=3

# gRPC
GRPC_HOST=0.0.0.0
GRPC_PORT=50051
INVENTORY_SERVICE_URL=http://localhost:50052

# Tracing
TRACING_ENVIRONMENT=development
TRACING_LOG_LEVEL=debug
TRACING_LOG_FORMAT=plain
CORS_ALLOWED_ORIGINS=*
PAGINATION_DEFAULT_LIMIT=50
PAGINATION_MAX_LIMIT=100
```

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/logistics-engine.git
   cd logistics-engine
   ```

2. Build the project:
   ```
   cargo build --release
   ```

3. Run database migrations:
   ```
   cargo run --bin migrate
   ```

4. Start the server:
   ```
   cargo run --release
   ```

### Docker Deployment

Build and run with Docker:

```
docker build -t logistics-engine .
docker run -p 8080:8080 --env-file .env logistics-engine
```

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create a new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Warehouses
- `GET /api/warehouses` - List all warehouses
- `POST /api/warehouses` - Create a new warehouse
- `GET /api/warehouses/:id` - Get warehouse by ID
- `PUT /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Delete warehouse

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Create an inventory item
- `GET /api/inventory/:id` - Get inventory item by ID
- `PUT /api/inventory/:id` - Update inventory item
- `PATCH /api/inventory/:id/quantity` - Adjust item quantity
- `POST /api/inventory/reservations` - Create reservation
- `GET /api/inventory/reservations/:id` - Get reservation
- `PUT /api/inventory/reservations/:id` - Update reservation
- `DELETE /api/inventory/reservations/:id` - Delete reservation

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/:id/items` - Get order items
- `POST /api/orders/:id/items` - Add order item
- `PUT /api/orders/items/:id` - Update order item
- `DELETE /api/orders/items/:id` - Delete order item

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments` - Create a payment
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `POST /api/payments/:id/process` - Process payment
- `POST /api/payments/:id/refund` - Refund payment

### Shipping
- `GET /api/shipping` - List all shipments
- `POST /api/shipping` - Create a shipment
- `GET /api/shipping/:id` - Get shipment by ID
- `PUT /api/shipping/:id` - Update shipment
- `PATCH /api/shipping/:id/status` - Update shipment status
- `POST /api/shipping/:id/deliver` - Mark shipment as delivered
- `GET /api/shipping/track/:number` - Track shipment by number

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/your-username/logistics-engine](https://github.com/your-username/logistics-engine) 