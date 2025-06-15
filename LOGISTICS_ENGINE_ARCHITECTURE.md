# Logistics Engine Architecture & Service Communication

## Overview

The Logistics Engine is a high-performance backend service built with Rust, designed to handle complex logistics operations including order management, inventory control, customer management, warehouse operations, payments, and shipping. It serves as the core orchestration layer in the Synkro ecosystem, using both synchronous and asynchronous communication patterns.

## Architecture Components

### Technology Stack

- **Language**: Rust
- **Web Framework**: Axum (HTTP API)
- **Database**: PostgreSQL with SQLx for async operations
- **Communication**: 
  - gRPC for synchronous service-to-service communication
  - RabbitMQ for asynchronous event-driven messaging
- **Authentication**: JWT-based authentication
- **Logging**: Tracing with structured logging
- **Configuration**: Environment variables with dotenv support

### Core Services Structure

```rust
// Main services in the logistics engine
├── CustomerService     - Customer management operations
├── WarehouseService   - Warehouse and location management
├── InventoryService   - Stock and inventory management
├── OrderService       - Order processing and lifecycle
├── PaymentService     - Payment processing
├── ShippingService    - Shipment tracking and management
├── AnalyticsService   - Reporting and analytics
└── OrderProducerService - Order generation for testing/simulation
```

## Service Communication Architecture

### 1. Internal HTTP API Layer

The logistics engine exposes REST APIs for external communication:

- **Port**: 8080 (configurable)
- **Framework**: Axum with tower middleware
- **Authentication**: JWT bearer tokens
- **Format**: JSON request/response

### 2. gRPC Communication Layer

**Server Side (Port 50051):**
- Exposes `OrderService` for other services to interact with orders
- Provides streaming capabilities for real-time order updates

**Client Side:**
- Connects to `InventoryService` (Port 50052) for stock management
- Handles inventory reservations, releases, and commitments

### 3. Event-Driven Messaging (RabbitMQ)

Asynchronous event publishing and consumption for decoupled service communication:

- **Exchange**: `order_events`
- **Queue**: `order_processing`
- **Patterns**: Publisher/Subscriber with Dead Letter Queues

## Service Communication Flow

### Core Service Interactions

```mermaid
graph TB
    subgraph "External Clients"
        WEB[Web Frontend]
        MOBILE[Mobile App]
        API[External APIs]
    end
    
    subgraph "Logistics Engine Core"
        HTTP[HTTP API Layer<br/>Port 8080]
        GRPC_SERVER[gRPC Server<br/>Port 50051]
        
        subgraph "Business Services"
            ORDER[Order Service]
            INV[Inventory Service]
            CUST[Customer Service]
            WAREHOUSE[Warehouse Service]
            PAYMENT[Payment Service]
            SHIPPING[Shipping Service]
            ANALYTICS[Analytics Service]
        end
        
        subgraph "Data Layer"
            DB[(PostgreSQL<br/>Database)]
            REPOS[Repository Layer]
        end
        
        subgraph "Communication Layer"
            MQ[RabbitMQ<br/>Event Bus]
            GRPC_CLIENT[gRPC Clients]
        end
    end
    
    subgraph "External Services"
        INVENTORY_SVC[Inventory Sync Service<br/>Port 50052]
        NOTIFICATION[Notification Service]
        DASHBOARD[Dashboard Service]
    end
    
    %% External client connections
    WEB --> HTTP
    MOBILE --> HTTP
    API --> HTTP
    
    %% Internal service connections
    HTTP --> ORDER
    HTTP --> CUST
    HTTP --> WAREHOUSE
    HTTP --> PAYMENT
    HTTP --> SHIPPING
    HTTP --> ANALYTICS
    
    %% gRPC connections
    GRPC_SERVER --> ORDER
    ORDER --> GRPC_CLIENT
    GRPC_CLIENT --> INVENTORY_SVC
    
    %% Database connections
    ORDER --> REPOS
    INV --> REPOS
    CUST --> REPOS
    WAREHOUSE --> REPOS
    PAYMENT --> REPOS
    SHIPPING --> REPOS
    ANALYTICS --> REPOS
    REPOS --> DB
    
    %% Event-driven messaging
    ORDER --> MQ
    PAYMENT --> MQ
    SHIPPING --> MQ
    MQ --> NOTIFICATION
    MQ --> DASHBOARD
    
    %% External service communication
    INVENTORY_SVC --> MQ
```

### Order Processing Flow

```mermaid
sequenceDiagram
    participant CLIENT as Client
    participant HTTP as HTTP API
    participant ORDER as Order Service
    participant GRPC as gRPC Client
    participant INV_SVC as Inventory Service
    participant MQ as RabbitMQ
    participant PAY as Payment Service
    participant SHIP as Shipping Service
    participant DB as Database
    
    CLIENT->>HTTP: POST /api/orders (Create Order)
    HTTP->>ORDER: create_order()
    
    %% Inventory Check & Reservation
    ORDER->>GRPC: check_and_reserve_stock()
    GRPC->>INV_SVC: CheckAndReserveStock(gRPC)
    INV_SVC-->>GRPC: StockReservationResponse
    GRPC-->>ORDER: Reservation Result
    
    alt Stock Available
        ORDER->>DB: Save Order (Pending)
        ORDER->>MQ: Publish OrderCreated Event
        ORDER-->>HTTP: Order Created (201)
        HTTP-->>CLIENT: Order Response
        
        %% Background Processing
        MQ->>PAY: Process Payment Event
        PAY->>DB: Update Payment Status
        PAY->>MQ: Publish PaymentProcessed Event
        
        MQ->>ORDER: Payment Processed Event
        ORDER->>DB: Update Order Status (Processing)
        ORDER->>GRPC: commit_reservation()
        GRPC->>INV_SVC: CommitReservation(gRPC)
        
        ORDER->>SHIP: Create Shipment
        SHIP->>DB: Save Shipment
        SHIP->>MQ: Publish ShipmentCreated Event
        
        ORDER->>MQ: Publish OrderStatusChanged Event
        
    else Stock Unavailable
        ORDER->>GRPC: release_reserved_stock()
        ORDER-->>HTTP: Stock Unavailable (409)
        HTTP-->>CLIENT: Error Response
    end
```

### Event-Driven Communication Flow

```mermaid
graph LR
    subgraph "Event Publishers"
        ORDER[Order Service]
        PAYMENT[Payment Service]
        SHIPPING[Shipping Service]
        INVENTORY[Inventory Service]
    end
    
    subgraph "Message Broker"
        EXCHANGE[order_events Exchange]
        QUEUE[order_processing Queue]
        DLQ[Dead Letter Queue]
    end
    
    subgraph "Event Consumers"
        NOTIFICATION[Notification Service]
        DASHBOARD[Dashboard Service]
        ANALYTICS[Analytics Service]
        EXTERNAL[External Systems]
    end
    
    %% Event publishing
    ORDER -->|OrderCreated<br/>OrderStatusChanged<br/>OrderCancelled| EXCHANGE
    PAYMENT -->|PaymentProcessed<br/>PaymentFailed| EXCHANGE
    SHIPPING -->|ShipmentCreated<br/>ShipmentStatusChanged| EXCHANGE
    INVENTORY -->|InventoryReserved<br/>InventoryReleased<br/>InventoryUpdated| EXCHANGE
    
    %% Message routing
    EXCHANGE --> QUEUE
    QUEUE -->|Failed Messages| DLQ
    
    %% Event consumption
    QUEUE --> NOTIFICATION
    QUEUE --> DASHBOARD
    QUEUE --> ANALYTICS
    QUEUE --> EXTERNAL
```

## gRPC Service Contracts

### Order Service (Server - Port 50051)

**Exposed Operations:**
- `CreateOrder` - Creates new orders from external services
- `GetOrder` - Retrieves order details
- `UpdateOrderStatus` - Updates order status
- `ListOrders` - Lists orders with pagination and filtering
- `StreamOrderUpdates` - Real-time order status streaming

### Inventory Service (Client - Port 50052)

**Consumed Operations:**
- `CheckAndReserveStock` - Validates and reserves inventory
- `ReleaseReservedStock` - Releases reservations for failed orders
- `CommitReservation` - Commits reservations for successful orders
- `GetInventoryLevels` - Retrieves current stock levels

## Event Types & Data Structures

### Order Events

```rust
// Published when a new order is created
OrderCreatedEvent {
    order_id: Uuid,
    customer_id: Uuid,
    status: String,
    total_amount: String,
    items_count: i32,
}

// Published when order status changes
OrderStatusChangedEvent {
    order_id: Uuid,
    previous_status: Option<String>,
    new_status: String,
    changed_by: Option<String>,
    notes: Option<String>,
}
```

### Inventory Events

```rust
// Published when inventory is reserved
InventoryReservedEvent {
    reservation_id: String,
    order_id: Uuid,
    items: Vec<ReservedItem>,
    warehouse_id: Uuid,
}

// Published when inventory is updated
InventoryUpdatedEvent {
    product_id: Uuid,
    sku: String,
    previous_quantity: i32,
    new_quantity: i32,
    warehouse_id: Uuid,
    reason: String,
}
```

## Database Schema Overview

### Core Entities

```mermaid
erDiagram
    CUSTOMERS {
        uuid id PK
        string name
        string email
        string phone
        json address
        timestamp created_at
        timestamp updated_at
    }
    
    WAREHOUSES {
        uuid id PK
        string name
        string code
        json location
        json capacity_info
        boolean active
        timestamp created_at
    }
    
    INVENTORY {
        uuid id PK
        uuid warehouse_id FK
        string product_id
        string sku
        int quantity
        int reserved_quantity
        decimal unit_cost
        string location
        timestamp updated_at
    }
    
    ORDERS {
        uuid id PK
        uuid customer_id FK
        string status
        decimal total_amount
        json shipping_address
        string notes
        timestamp created_at
        timestamp updated_at
    }
    
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        string product_id
        string name
        string sku
        int quantity
        decimal unit_price
        decimal total_price
    }
    
    PAYMENTS {
        uuid id PK
        uuid order_id FK
        decimal amount
        string currency
        string payment_method
        string status
        string transaction_id
        timestamp processed_at
    }
    
    SHIPMENTS {
        uuid id PK
        uuid order_id FK
        string tracking_number
        string carrier
        string status
        json shipping_address
        timestamp shipped_at
        timestamp delivered_at
    }
    
    CUSTOMERS ||--o{ ORDERS : places
    WAREHOUSES ||--o{ INVENTORY : stores
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o| PAYMENTS : has
    ORDERS ||--o| SHIPMENTS : ships
```

## Service Integration Patterns

### 1. Synchronous Communication (gRPC)

**Used for:**
- Critical operations requiring immediate response
- Stock reservations and inventory checks
- Order status inquiries
- Real-time data streaming

**Benefits:**
- Strong consistency
- Type-safe contracts
- Efficient binary protocol
- Streaming support

### 2. Asynchronous Communication (RabbitMQ)

**Used for:**
- Event notifications
- Background processing
- Service decoupling
- Cross-service data synchronization

**Benefits:**
- Loose coupling
- Resilience to failures
- Scalability
- Event sourcing capabilities

## Configuration & Deployment

### Environment Variables

```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
NODE_ENV=production

# Database
DATABASE_URL=postgres://user:pass@localhost:5433/logistics
DB_MAX_CONNECTIONS=10
DB_TIMEOUT_SECONDS=30

# gRPC
GRPC_HOST=0.0.0.0
GRPC_PORT=50051
INVENTORY_SERVICE_URL=http://localhost:50052

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/%2f
RABBITMQ_ORDER_EXCHANGE=order_events
RABBITMQ_ORDER_QUEUE=order_processing

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRATION=86400
```

### Docker & Kubernetes Deployment

**Docker Container:**
- Multi-stage build for optimized production image
- Health checks for service monitoring
- Graceful shutdown handling

**Kubernetes Deployment:**
- Service mesh integration
- Auto-scaling based on CPU/memory
- Rolling updates with zero downtime
- ConfigMaps and Secrets management

## Monitoring & Observability

### Metrics Collection

- **Prometheus integration** for custom metrics
- **Request/response timing** for performance monitoring
- **Database connection pool** monitoring
- **gRPC call success/failure rates**
- **RabbitMQ message throughput**

### Logging & Tracing

- **Structured logging** with tracing crate
- **Request ID propagation** across service calls
- **Error tracking** with context preservation
- **Performance profiling** for optimization

### Health Checks

- **Database connectivity** verification
- **RabbitMQ connection** health
- **gRPC service availability**
- **External service dependencies**

## Error Handling & Resilience

### Error Types

```rust
// Custom error types for different failure scenarios
pub enum LogisticsError {
    DatabaseError(sqlx::Error),
    ValidationError(String),
    NotFoundError(String),
    BusinessLogicError(String),
    ExternalServiceError(String),
    AuthenticationError(String),
}
```

### Resilience Patterns

1. **Circuit Breaker** - For external service calls
2. **Retry Logic** - With exponential backoff
3. **Timeout Handling** - Configurable request timeouts
4. **Graceful Degradation** - Fallback mechanisms
5. **Dead Letter Queues** - For failed message processing

## Performance Optimization

### Database Optimizations

- **Connection pooling** with configurable limits
- **Query optimization** with proper indexing
- **Prepared statements** for frequently used queries
- **Batch operations** for bulk inserts/updates

### Service Optimizations

- **Async/await** throughout the application
- **Lazy loading** of service dependencies
- **Caching strategies** for frequently accessed data
- **Efficient serialization** with optimized protocols

This architecture ensures the Logistics Engine can handle high-throughput operations while maintaining data consistency, service reliability, and system scalability across the entire Synkro ecosystem. 