# gRPC and RabbitMQ Implementation

This document explains how gRPC and RabbitMQ are implemented in the Logistics Engine application.

## Overview

The Logistics Engine uses a hybrid communication approach:

- **gRPC** for synchronous, direct service-to-service communication
- **RabbitMQ** for asynchronous event broadcasting and decoupled communication

## Directory Structure

```
logistics-engine/
├── src/
│   ├── grpc/             # gRPC implementation
│   │   ├── mod.rs        # Main module with client initialization
│   │   ├── inventory/    # Inventory service gRPC client
│   │   │   ├── mod.rs
│   │   │   ├── client.rs # Inventory client implementation
│   │   │   └── server.rs # Placeholder for server implementation
│   │   └── order/        # Order service gRPC server
│   │       ├── mod.rs    
│   │       └── server.rs # Order service gRPC server implementation
│   ├── mq/               # RabbitMQ implementation
│   │   ├── mod.rs        # Main module with initialization
│   │   ├── events.rs     # Event type definitions
│   │   ├── publisher.rs  # Publisher implementation
│   │   ├── consumer.rs   # Consumer implementation
│   │   ├── dlq.rs        # Dead Letter Queue handling
│   │   └── connection.rs # Connection resilience
│   └── ...
├── proto/                # Protocol buffer definitions
│   ├── inventory_service.proto
│   └── order_service.proto
└── ...
```

## gRPC Implementation

### Client Initialization

The gRPC clients are initialized at application startup in `main.rs`:

```rust
// Initialize gRPC clients
grpc::init_grpc_clients().await?;
```

The `init_grpc_clients()` function sets up connections to external gRPC services, particularly the Inventory Service.

### Inventory Service Client

The Inventory Service client is used to check and reserve stock when creating orders. It provides the following methods:

- `check_and_reserve_stock` - Checks if products are in stock and reserves them
- `release_reserved_stock` - Releases reserved stock for failed or cancelled orders
- `commit_reservation` - Commits a reservation for successful orders
- `get_inventory_levels` - Gets current inventory levels for products

### Order Service Server

The Order Service exposes a gRPC server that other services can use to interact with orders. It provides these operations:

- `create_order` - Creates a new order
- `get_order` - Gets details of an existing order
- `update_order_status` - Updates an order's status
- `list_orders` - Lists orders with pagination
- `stream_order_updates` - Streams real-time order status updates

The gRPC server is started alongside the HTTP server in `main.rs`:

```rust
// Start the gRPC server in a background task
let grpc_app_state = Arc::new(app_state);
tokio::spawn(start_grpc_server(grpc_app_state));
```

### Error Handling

gRPC errors are translated to and from application errors in `error/grpc.rs`, ensuring consistent error handling throughout the application.

## RabbitMQ Implementation

### Event Types

All event types are defined in `mq/events.rs`, structured as:

```rust
pub struct Event<T> {
    pub id: Uuid,
    pub event_type: EventType, 
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub data: T,
}
```

Specific event types include:
- Order events (created, status changed, cancelled)
- Inventory events (updated, reserved, released)
- Shipment events (created, status changed)
- Payment events (processed, failed)

### Publisher

The publisher in `mq/publisher.rs` provides:
- Connection pool management
- Exchange declaration
- Persistent message publishing with proper delivery guarantees

Usage example:

```rust
publisher::publish_event(
    EventType::OrderCreated,
    "order.created",
    order_created_event,
).await?;
```

### Consumer

The consumer in `mq/consumer.rs` provides:
- Handler registration for different event types
- Queue declaration and binding
- Message acknowledgment
- Error handling

### Dead Letter Queues

Dead Letter Queues are implemented in `mq/dlq.rs` to handle failed message processing. When a message fails to be processed, it's routed to a dead letter queue for later inspection or reprocessing.

### Connection Resilience

Connection resilience is implemented in `mq/connection.rs` with:
- Automatic reconnection with exponential backoff
- Connection and channel recovery
- Error handling

## Integration with Services

### Order Service Integration

The Order Service integrates with both gRPC and RabbitMQ:

1. When creating an order, it:
   - Checks inventory via gRPC
   - Creates the order in the database
   - Publishes an OrderCreated event via RabbitMQ

2. When updating an order status, it:
   - Updates the status in the database
   - Publishes an OrderStatusChanged event via RabbitMQ
   - For cancelled orders, it also releases inventory via gRPC

## Testing

Test coverage includes:
- Unit tests for individual components
- Integration tests for publisher/consumer pairs
- Dead letter queue testing
- Resilience testing with connection failures

## Configuration

Configuration is managed through environment variables:

```
# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/%2f
RABBITMQ_ORDER_EXCHANGE=order_events
RABBITMQ_ORDER_QUEUE=order_processing
RABBITMQ_RETRY_ATTEMPTS=3

# gRPC
GRPC_HOST=0.0.0.0
GRPC_PORT=50051
INVENTORY_SERVICE_URL=http://localhost:50052
``` 