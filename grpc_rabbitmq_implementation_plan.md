# Logistics Engine: gRPC and RabbitMQ Implementation Plan

This document outlines a comprehensive plan for implementing and optimizing the usage of gRPC and RabbitMQ within the Logistics Engine system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [gRPC Implementation](#grpc-implementation)
   - [Service Definitions](#service-definitions)
   - [Client Implementation](#grpc-client-implementation)
   - [Server Implementation](#grpc-server-implementation)
   - [Error Handling and Resilience](#grpc-error-handling-and-resilience)
   - [Performance Optimization](#grpc-performance-optimization)
3. [RabbitMQ Implementation](#rabbitmq-implementation)
   - [Event Types and Schemas](#event-types-and-schemas)
   - [Publisher Implementation](#publisher-implementation)
   - [Consumer Implementation](#consumer-implementation)
   - [Error Handling and Dead Letter Queues](#rabbitmq-error-handling-and-dlq)
   - [Resilience and Reconnection](#resilience-and-reconnection)
4. [Integration Points](#integration-points)
5. [Testing Strategy](#testing-strategy)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Deployment Considerations](#deployment-considerations)
8. [Implementation Timeline](#implementation-timeline)

## Architecture Overview

The Logistics Engine is a core component in a microservices architecture that manages order processing and logistics operations. Based on the codebase analysis, we can identify the following key integration points:

- **gRPC**: Used for synchronous, direct service-to-service communication, particularly between:
  - Order Service -> Inventory Service (stock reservation, availability checks)
  - Order Service -> Logistics Service (shipping arrangements)
  - Inventory Service -> AI Service (demand forecasting)

- **RabbitMQ**: Used for asynchronous event broadcasting, particularly for:
  - Order status changes (created, processing, shipped, delivered, etc.)
  - Inventory updates (stock levels, reservations)
  - Notifications to customers and internal systems

This hybrid approach leverages the strengths of both technologies:
- gRPC for performance-critical, synchronous operations
- RabbitMQ for reliable, decoupled event distribution

## gRPC Implementation

### Service Definitions

Based on the existing proto files, we already have defined services for Orders and Inventory. We need to ensure the implementations are complete and optimized.

#### Inventory Service Implementation

The Inventory Service has the following defined operations:
- CheckAndReserveStock
- ReleaseReservedStock
- CommitReservation
- GetInventoryLevels

Implementation path: `src/grpc/inventory/`

```rust
// src/grpc/inventory/client.rs
use tonic::transport::{Channel, Endpoint};
use crate::config::get as get_config;
use std::time::Duration;

use inventory::{
    inventory_service_client::InventoryServiceClient,
    StockReservationRequest, StockReservationResponse,
    ReleaseStockRequest, ReleaseStockResponse,
    CommitReservationRequest, CommitReservationResponse,
    InventoryLevelsRequest, InventoryLevelsResponse,
    ProductItem
};

pub struct InventoryClient {
    client: InventoryServiceClient<Channel>,
}

impl InventoryClient {
    pub async fn new() -> Result<Self, tonic::transport::Error> {
        let config = get_config();
        let endpoint = Endpoint::from_str(&config.grpc.inventory_url)?
            .timeout(Duration::from_secs(10))
            .connect_timeout(Duration::from_secs(5))
            .tcp_keepalive(Some(Duration::from_secs(30)));

        let client = InventoryServiceClient::connect(endpoint).await?;
        Ok(Self { client })
    }

    pub async fn check_and_reserve_stock(
        &mut self,
        order_id: String, 
        items: Vec<ProductItem>, 
        warehouse_id: String
    ) -> Result<StockReservationResponse, tonic::Status> {
        let request = StockReservationRequest {
            order_id,
            items,
            warehouse_id,
        };
        
        let response = self.client.check_and_reserve_stock(request).await?;
        Ok(response.into_inner())
    }

    // Implement other methods: release_reserved_stock, commit_reservation, get_inventory_levels
    // ...
}
```

#### Order Service gRPC Server Implementation

The Order Service should expose gRPC endpoints for other services to query orders:

```rust
// src/grpc/order/server.rs
use tonic::{Request, Response, Status};
use crate::services::OrderService;
use std::sync::Arc;

use order::{
    order_service_server::{OrderService as GrpcOrderService, OrderServiceServer},
    CreateOrderRequest, OrderResponse, GetOrderRequest,
    UpdateOrderStatusRequest, ListOrdersRequest, ListOrdersResponse,
    StreamOrderUpdatesRequest, OrderStatusEvent
};

pub struct OrderGrpcService {
    order_service: Arc<OrderService>,
}

impl OrderGrpcService {
    pub fn new(order_service: Arc<OrderService>) -> Self {
        Self { order_service }
    }
    
    pub fn into_service(self) -> OrderServiceServer<Self> {
        OrderServiceServer::new(self)
    }
}

#[tonic::async_trait]
impl GrpcOrderService for OrderGrpcService {
    async fn create_order(
        &self,
        request: Request<CreateOrderRequest>
    ) -> Result<Response<OrderResponse>, Status> {
        // Implement by converting gRPC request to internal DTO
        // Call order_service.create_order
        // Convert result back to gRPC response
        // Return proper error codes on failure
    }
    
    // Implement the other methods
    // ...
    
    // For streaming updates - this is particularly important for real-time order status tracking
    type StreamOrderUpdatesStream = tokio_stream::wrappers::ReceiverStream<Result<OrderStatusEvent, Status>>;
    
    async fn stream_order_updates(
        &self,
        request: Request<StreamOrderUpdatesRequest>
    ) -> Result<Response<Self::StreamOrderUpdatesStream>, Status> {
        // Set up channel
        // Transform OrderStatusEvents into stream
        // Return stream for client consumption
    }
}
```

### gRPC Client Implementation

Both client and server implementations need proper connection management, timeouts, and error handling:

```rust
// src/grpc/mod.rs
pub mod inventory;
pub mod order;

use crate::error::AppError;
use std::sync::Arc;
use tokio::sync::OnceCell;

static INVENTORY_CLIENT: OnceCell<Arc<inventory::InventoryClient>> = OnceCell::const_new();

pub async fn init_grpc_clients() -> Result<(), AppError> {
    let inventory_client = inventory::InventoryClient::new().await
        .map_err(|e| AppError::GrpcError(format!("Failed to initialize inventory client: {}", e)))?;
    
    INVENTORY_CLIENT.set(Arc::new(inventory_client))
        .map_err(|_| AppError::InternalServerError("INVENTORY_CLIENT already initialized".to_string()))?;
    
    Ok(())
}

pub async fn get_inventory_client() -> Result<Arc<inventory::InventoryClient>, AppError> {
    INVENTORY_CLIENT.get_or_try_init(async {
        let client = inventory::InventoryClient::new().await
            .map_err(|e| AppError::GrpcError(format!("Failed to initialize inventory client: {}", e)))?;
        Ok(Arc::new(client))
    }).await.map(|client| client.clone())
}
```

### gRPC Server Implementation

Setting up the gRPC server alongside the HTTP server:

```rust
// In main.rs or appropriate startup file
async fn start_grpc_server(app_state: Arc<api::AppState>) -> Result<(), Box<dyn std::error::Error>> {
    let config = get_config();
    let addr = format!("{}:{}", config.grpc.host, config.grpc.port).parse()?;
    
    let order_grpc_service = OrderGrpcService::new(app_state.order_service.clone());
    
    info!("Starting gRPC server on {}", addr);
    
    tonic::transport::Server::builder()
        .add_service(order_grpc_service.into_service())
        // Add more services as needed
        .serve(addr)
        .await?;
    
    Ok(())
}

// Add this to main() function:
// tokio::spawn(start_grpc_server(Arc::clone(&app_state)));
```

### gRPC Error Handling and Resilience

Proper error handling and conversion between application errors and gRPC status codes:

```rust
// src/error/grpc.rs
use tonic::Status;
use tonic::Code;
use crate::error::AppError;

impl From<AppError> for Status {
    fn from(error: AppError) -> Self {
        match error {
            AppError::NotFound(entity) => 
                Status::new(Code::NotFound, format!("Not found: {}", entity)),
            AppError::BadRequest(message) => 
                Status::new(Code::InvalidArgument, message),
            AppError::Validation(message) => 
                Status::new(Code::InvalidArgument, message),
            AppError::Unauthorized(message) => 
                Status::new(Code::Unauthenticated, message),
            AppError::Forbidden(message) => 
                Status::new(Code::PermissionDenied, message),
            AppError::DatabaseError(e) => 
                Status::new(Code::Internal, format!("Database error: {}", e)),
            // Handle other error types
            _ => Status::new(Code::Internal, "Internal server error"),
        }
    }
}
```

### gRPC Performance Optimization

To ensure optimal performance:

1. Use connection pooling for clients
2. Implement circuit breakers for resilience
3. Apply proper timeout configurations
4. Consider compression for large payloads
5. Use proper load balancing when scaling horizontally

## RabbitMQ Implementation

### Event Types and Schemas

Define clear event schemas for all events passing through RabbitMQ:

```rust
// src/mq/events.rs
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub enum EventType {
    OrderCreated,
    OrderStatusChanged,
    OrderCancelled,
    InventoryReserved,
    InventoryReleased,
    InventoryUpdated,
    ShipmentCreated,
    ShipmentStatusChanged,
    PaymentProcessed,
    PaymentFailed,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Event<T> {
    pub id: Uuid,
    pub event_type: EventType,
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub data: T,
}

// Some specific event data types
#[derive(Debug, Serialize, Deserialize)]
pub struct OrderStatusChangedEvent {
    pub order_id: Uuid,
    pub previous_status: Option<String>,
    pub new_status: String,
    pub changed_by: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryUpdatedEvent {
    pub product_id: Uuid,
    pub sku: String,
    pub previous_quantity: i32,
    pub new_quantity: i32,
    pub warehouse_id: Uuid,
    pub reason: String,
}

// More event-specific data structures
// ...
```

### Publisher Implementation

Create a reliable publishing interface:

```rust
// src/mq/publisher.rs
use crate::config::get as get_config;
use crate::error::AppError;
use crate::mq::events::{Event, EventType};
use deadpool_lapin::{Manager, Pool, PoolError};
use lapin::{
    options::{BasicPublishOptions, ExchangeDeclareOptions},
    BasicProperties, ExchangeKind
};
use serde::Serialize;
use std::sync::OnceLock;
use tokio::sync::Mutex;

static RABBITMQ_POOL: OnceLock<Mutex<Pool>> = OnceLock::new();

pub async fn init_rabbitmq_pool() -> Result<(), AppError> {
    let config = get_config();
    let manager = Manager::new(config.rabbitmq.url.clone(), deadpool_lapin::Runtime::Tokio1);
    let pool = Pool::builder(manager)
        .max_size(10)
        .build()
        .map_err(|e| AppError::RabbitMQError(format!("Failed to create RabbitMQ pool: {}", e)))?;
    
    // Initialize the pool
    let _ = RABBITMQ_POOL.get_or_init(|| Mutex::new(pool));
    
    // Test the connection
    let conn = get_rabbitmq_connection().await?;
    let channel = conn.create_channel().await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to create channel: {}", e)))?;
    
    // Declare exchanges
    let config = get_config();
    channel
        .exchange_declare(
            &config.rabbitmq.order_exchange,
            ExchangeKind::Topic,
            ExchangeDeclareOptions {
                durable: true,
                ..Default::default()
            },
            Default::default(),
        )
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to declare exchange: {}", e)))?;
    
    Ok(())
}

async fn get_rabbitmq_connection() -> Result<deadpool_lapin::Object, AppError> {
    let pool = match RABBITMQ_POOL.get() {
        Some(pool) => pool,
        None => return Err(AppError::InternalServerError(
            "RabbitMQ pool not initialized".to_string()
        )),
    };
    
    let guard = pool.lock().await;
    guard.get().await
        .map_err(|e: PoolError| AppError::RabbitMQError(format!("Failed to get connection: {}", e)))
}

pub async fn publish_event<T: Serialize>(
    event_type: EventType,
    routing_key: &str,
    data: T,
) -> Result<(), AppError> {
    let event = Event {
        id: Uuid::new_v4(),
        event_type,
        timestamp: Utc::now(),
        version: "1.0".to_string(),
        data,
    };
    
    let json = serde_json::to_string(&event)
        .map_err(|e| AppError::InternalServerError(format!("JSON serialization error: {}", e)))?;
    
    let conn = get_rabbitmq_connection().await?;
    let channel = conn.create_channel().await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to create channel: {}", e)))?;
    
    let config = get_config();
    channel
        .basic_publish(
            &config.rabbitmq.order_exchange,
            routing_key,
            BasicPublishOptions::default(),
            json.as_bytes(),
            BasicProperties::default()
                .with_delivery_mode(2) // persistent
                .with_content_type("application/json".into()),
        )
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to publish message: {}", e)))?;
    
    Ok(())
}
```

### Consumer Implementation

Create a flexible consumer framework:

```rust
// src/mq/consumer.rs
use crate::config::get as get_config;
use crate::error::AppError;
use crate::mq::events::{Event, EventType};
use deadpool_lapin::Pool;
use futures_lite::StreamExt;
use lapin::{
    options::{BasicAckOptions, BasicConsumeOptions, ExchangeDeclareOptions, QueueBindOptions, QueueDeclareOptions},
    types::FieldTable,
    ExchangeKind,
};
use serde::de::DeserializeOwned;
use std::sync::Arc;
use tokio::task::JoinHandle;

pub struct RabbitMQConsumer {
    pool: Arc<Pool>,
    handlers: Vec<JoinHandle<()>>,
}

impl RabbitMQConsumer {
    pub async fn new(pool: Arc<Pool>) -> Self {
        Self {
            pool,
            handlers: Vec::new(),
        }
    }
    
    pub async fn register_handler<T, F>(
        &mut self,
        queue_name: &str,
        exchange_name: &str,
        routing_key: &str,
        handler: F,
    ) -> Result<(), AppError>
    where
        T: DeserializeOwned + Send + 'static,
        F: Fn(Event<T>) -> futures_lite::future::BoxFuture<'static, Result<(), AppError>> + Send + Sync + 'static,
    {
        let conn = self.pool.get().await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to get connection: {}", e)))?;
        
        let channel = conn.create_channel().await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to create channel: {}", e)))?;
        
        // Declare exchange
        channel
            .exchange_declare(
                exchange_name,
                ExchangeKind::Topic,
                ExchangeDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                Default::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to declare exchange: {}", e)))?;
        
        // Declare queue
        channel
            .queue_declare(
                queue_name,
                QueueDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                Default::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to declare queue: {}", e)))?;
        
        // Bind queue to exchange
        channel
            .queue_bind(
                queue_name,
                exchange_name,
                routing_key,
                QueueBindOptions::default(),
                FieldTable::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to bind queue: {}", e)))?;
        
        // Start consumer
        let consumer = channel
            .basic_consume(
                queue_name,
                &format!("consumer-{}", Uuid::new_v4()),
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to start consumer: {}", e)))?;
        
        let handler = Arc::new(handler);
        
        let handle = tokio::spawn(async move {
            let mut consumer = consumer;
            
            while let Some(delivery) = consumer.next().await {
                if let Ok(delivery) = delivery {
                    match serde_json::from_slice::<Event<T>>(&delivery.data) {
                        Ok(event) => {
                            let handler_clone = handler.clone();
                            if let Err(e) = handler_clone(event).await {
                                // Log error but continue processing
                                eprintln!("Error processing message: {}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error deserializing message: {}", e);
                        }
                    }
                    
                    // Acknowledge message
                    if let Err(e) = delivery.ack(BasicAckOptions::default()).await {
                        eprintln!("Failed to acknowledge message: {}", e);
                    }
                }
            }
        });
        
        self.handlers.push(handle);
        Ok(())
    }
    
    pub async fn shutdown(self) {
        for handle in self.handlers {
            handle.abort();
        }
    }
}
```

### RabbitMQ Error Handling and DLQ

Implement Dead Letter Queues for handling failed message processing:

```rust
// src/mq/dlq.rs
use lapin::{options::{QueueDeclareOptions, QueueBindOptions}, types::FieldTable, ExchangeKind};

pub async fn setup_dead_letter_queue(
    channel: &lapin::Channel,
    queue_name: &str,
    exchange_name: &str,
    routing_key: &str,
) -> Result<(), lapin::Error> {
    // Declare the DLX (Dead Letter Exchange)
    let dlx_name = format!("{}.dlx", exchange_name);
    channel
        .exchange_declare(
            &dlx_name,
            ExchangeKind::Topic,
            lapin::options::ExchangeDeclareOptions {
                durable: true,
                ..Default::default()
            },
            Default::default(),
        )
        .await?;
    
    // Declare the DLQ (Dead Letter Queue)
    let dlq_name = format!("{}.dlq", queue_name);
    channel
        .queue_declare(
            &dlq_name,
            QueueDeclareOptions {
                durable: true,
                ..Default::default()
            },
            Default::default(),
        )
        .await?;
    
    // Bind the DLQ to the DLX
    channel
        .queue_bind(
            &dlq_name,
            &dlx_name,
            routing_key,
            QueueBindOptions::default(),
            FieldTable::default(),
        )
        .await?;
    
    // Create arguments for the main queue pointing to the DLX
    let mut args = FieldTable::default();
    args.insert("x-dead-letter-exchange".into(), dlx_name.into());
    args.insert("x-dead-letter-routing-key".into(), routing_key.into());
    
    // Declare the main queue with DLX configuration
    channel
        .queue_declare(
            queue_name,
            QueueDeclareOptions {
                durable: true,
                ..Default::default()
            },
            args,
        )
        .await?;
    
    Ok(())
}
```

### Resilience and Reconnection

Implement connection recovery and resilience:

```rust
// src/mq/connection.rs
use crate::config::get as get_config;
use crate::error::AppError;
use deadpool_lapin::{Manager, Pool, PoolError};
use std::time::Duration;
use tokio::time;

pub async fn create_resilient_connection() -> Result<lapin::Connection, AppError> {
    let config = get_config();
    let options = lapin::ConnectionProperties::default()
        .with_connection_name("logistics-engine-connection".into())
        .with_executor(tokio_executor_trait::Tokio::current());
    
    let mut retry_count = 0;
    let max_retries = config.rabbitmq.retry_attempts;
    
    loop {
        match lapin::Connection::connect(&config.rabbitmq.url, options.clone()).await {
            Ok(conn) => return Ok(conn),
            Err(err) => {
                retry_count += 1;
                if retry_count > max_retries {
                    return Err(AppError::RabbitMQError(format!(
                        "Failed to connect to RabbitMQ after {} attempts: {}",
                        max_retries, err
                    )));
                }
                
                let backoff_seconds = retry_count * 2;
                eprintln!(
                    "Failed to connect to RabbitMQ (attempt {}/{}), retrying in {} seconds: {}",
                    retry_count, max_retries, backoff_seconds, err
                );
                
                time::sleep(Duration::from_secs(backoff_seconds)).await;
            }
        }
    }
}
```

## Integration Points

### Order Service Integration

The Order Service should publish events when orders change status, and use gRPC for inventory checks:

```rust
// src/services/order_service.rs
impl OrderService {
    // ...existing code...
    
    pub async fn create_order(&self, dto: CreateOrderDto) -> Result<Order, AppError> {
        // Check inventory via gRPC first
        let inventory_client = crate::grpc::get_inventory_client().await?;
        
        let product_items = dto.items.iter().map(|item| inventory::ProductItem {
            product_id: item.product_id.to_string(),
            sku: item.sku.clone(),
            quantity: item.quantity,
        }).collect::<Vec<_>>();
        
        let reservation = inventory_client
            .check_and_reserve_stock(
                Uuid::new_v4().to_string(), // temporary order ID
                product_items,
                dto.warehouse_id.to_string(),
            )
            .await
            .map_err(|e| AppError::InventoryServiceError(e.to_string()))?;
        
        if !reservation.success {
            return Err(AppError::BadRequest(format!(
                "Inventory check failed: {}",
                reservation.message
            )));
        }
        
        // Create the order in the database
        let order = self.repository.create(dto).await?;
        
        // Publish order created event
        let event_data = OrderCreatedEvent {
            order_id: order.id,
            customer_id: order.customer_id,
            status: "pending".to_string(),
            total_amount: order.total_amount.to_string(),
            items_count: order.items.len() as i32,
        };
        
        crate::mq::publisher::publish_event(
            EventType::OrderCreated,
            "order.created",
            event_data,
        ).await?;
        
        // Commit the inventory reservation
        inventory_client
            .commit_reservation(
                reservation.reservation_id,
                order.id.to_string(),
            )
            .await
            .map_err(|e| AppError::InventoryServiceError(e.to_string()))?;
        
        Ok(order)
    }
    
    pub async fn update_order_status(
        &self,
        id: Uuid,
        status: OrderStatus,
        notes: Option<String>,
    ) -> Result<Order, AppError> {
        let order = self.repository.find_by_id(id).await?;
        
        if order.is_none() {
            return Err(AppError::NotFound("Order".to_string(), id.to_string()));
        }
        
        let old_order = order.unwrap();
        let old_status = old_order.status.clone();
        
        let updated_order = self.repository
            .update_status(id, status.clone(), notes.clone())
            .await?;
        
        // Publish order status changed event
        let event_data = OrderStatusChangedEvent {
            order_id: id,
            previous_status: Some(format!("{:?}", old_status)),
            new_status: format!("{:?}", status),
            changed_by: None,
            notes,
        };
        
        crate::mq::publisher::publish_event(
            EventType::OrderStatusChanged,
            &format!("order.status.{}", status.to_string().to_lowercase()),
            event_data,
        ).await?;
        
        Ok(updated_order)
    }
}
```

### Inventory Service Integration

```rust
// src/services/inventory_service.rs
impl InventoryService {
    // ...existing code...
    
    pub async fn update_item_quantity(
        &self,
        id: Uuid,
        quantity_change: i32,
        reason: String,
    ) -> Result<InventoryItem, AppError> {
        let item = self.repository.find_item_by_id(id).await?;
        
        if item.is_none() {
            return Err(AppError::NotFound("Inventory Item".to_string(), id.to_string()));
        }
        
        let item = item.unwrap();
        let previous_quantity = item.quantity;
        let new_quantity = previous_quantity + quantity_change;
        
        if new_quantity < 0 {
            return Err(AppError::BadRequest(
                "Inventory quantity cannot be negative".to_string(),
            ));
        }
        
        let updated_item = self.repository
            .update_item_quantity(id, new_quantity)
            .await?;
        
        // Publish inventory updated event
        let event_data = InventoryUpdatedEvent {
            product_id: id,
            sku: updated_item.sku.clone(),
            previous_quantity,
            new_quantity,
            warehouse_id: updated_item.warehouse_id,
            reason,
        };
        
        crate::mq::publisher::publish_event(
            EventType::InventoryUpdated,
            "inventory.updated",
            event_data,
        ).await?;
        
        Ok(updated_item)
    }
}
```

## Testing Strategy

1. **Unit Tests**: Test individual components (publishers, consumers, gRPC clients/servers)
2. **Integration Tests**: Test the interaction between components 
3. **End-to-End Tests**: Test complete flows through the system
4. **Load Tests**: Verify performance under load
5. **Resilience Tests**: Verify behavior during failures (network outages, service unavailability)

Example test:

```rust
// tests/integration/mq_test.rs
#[tokio::test]
async fn test_order_status_event_flow() {
    // Setup test environment
    // ...
    
    // Create a test order
    let order_id = Uuid::new_v4();
    
    // Create a channel to receive the event
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    
    // Register a test consumer
    let mut consumer = RabbitMQConsumer::new(Arc::clone(&pool)).await;
    consumer.register_handler::<OrderStatusChangedEvent, _>(
        "test.orders.status",
        "order_events",
        "order.status.#",
        move |event| {
            let tx = tx.clone();
            Box::pin(async move {
                if event.data.order_id == order_id {
                    tx.send(event.data).await.unwrap();
                }
                Ok(())
            })
        },
    ).await.unwrap();
    
    // Update order status
    let order_service = get_test_order_service().await;
    order_service
        .update_order_status(
            order_id,
            OrderStatus::Processing,
            Some("Test status update".to_string()),
        )
        .await
        .unwrap();
    
    // Wait for the event with timeout
    let received = tokio::time::timeout(Duration::from_secs(5), rx.recv()).await;
    
    // Verify the event
    assert!(received.is_ok());
    let event = received.unwrap().unwrap();
    assert_eq!(event.order_id, order_id);
    assert_eq!(event.new_status, "Processing");
    assert_eq!(event.notes, Some("Test status update".to_string()));
}
```

## Monitoring and Observability

1. **Metrics Collection**:
   - Queue depths
   - Message processing rates
   - gRPC request/response times
   - Error counts by type

2. **Tracing**:
   - Distributed request tracing (using OpenTelemetry)
   - Correlation IDs between services

3. **Alerting**:
   - Queue depth thresholds
   - Error rate thresholds
   - Service latency thresholds

4. **Logging**:
   - Structured logging for all MQ and gRPC operations
   - Log sampling for high-volume events

## Deployment Considerations

1. **Scaling**:
   - Horizontal scaling of consumers
   - Load balancing for gRPC services

2. **Resource Requirements**:
   - Memory and CPU for message processing
   - Network bandwidth for high-throughput systems

3. **Security**:
   - TLS for gRPC connections
   - Authentication for RabbitMQ

4. **High Availability**:
   - RabbitMQ clustering
   - Service redundancy

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Set up gRPC and RabbitMQ infrastructure
- Implement basic client/server and publisher/consumer frameworks
- Establish error handling patterns

### Phase 2: Core Services (Week 2)
- Implement Order Service gRPC server and RabbitMQ publishers
- Implement Inventory Service gRPC client
- Create basic event flow between services

### Phase 3: Reliability & Resilience (Week 3)
- Add Dead Letter Queues and retry mechanisms
- Implement reconnection logic
- Add comprehensive error handling

### Phase 4: Optimization & Scaling (Week 4)
- Performance tuning
- Monitoring and metrics
- Load testing and optimization

### Phase 5: Integration & Testing (Week 5)
- Full integration with all services
- End-to-end testing
- Documentation and deployment preparations 