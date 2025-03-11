# Synkro Inventory and Logistics Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Services Architecture](#services-architecture)
   - [Inventory Sync Service](#inventory-sync-service)
   - [Logistics Engine](#logistics-engine)
3. [Communication Patterns](#communication-patterns)
   - [gRPC Communication](#grpc-communication)
   - [RabbitMQ Message Patterns](#rabbitmq-message-patterns)
4. [Key Operations](#key-operations)
   - [Inventory Management](#inventory-management)
   - [Order Processing](#order-processing)
   - [Stock Reservation](#stock-reservation)
5. [Data Models](#data-models)
6. [API Reference](#api-reference)
7. [Deployment Architecture](#deployment-architecture)
8. [Monitoring and Observability](#monitoring-and-observability)

## System Overview

Synkro is a distributed microservices platform designed to handle inventory management and logistics operations for e-commerce and retail applications. The system follows a modern cloud-native architecture with clearly defined service boundaries, communication protocols, and data ownership.

```mermaid
graph TB
    Client[Client Applications] --> API[API Gateway]
    API --> LE[Logistics Engine]
    API --> IS[Inventory Sync Service]
    LE <-->|gRPC| IS
    IS --> DB_IS[(Inventory Database)]
    LE --> DB_LE[(Logistics Database)]
    LE <-->|RabbitMQ| MS[Message System]
    
    classDef service fill:#b8f9d6,stroke:#333,stroke-width:2px
    classDef database fill:#f9e0b8,stroke:#333,stroke-width:2px
    classDef client fill:#f9d6ff,stroke:#333,stroke-width:2px
    
    class LE,IS service
    class DB_IS,DB_LE database
    class Client,API client
```

The system architecture follows these key principles:

1. **Service Independence**: Each service has clear responsibilities and owns its data
2. **API-First Design**: Well-defined APIs using gRPC and REST
3. **Event-Driven**: Critical state changes are communicated via messaging
4. **Database-Per-Service**: Each service manages its own data store
5. **Cloud-Native**: Designed for containerization and orchestration

## Services Architecture

### Inventory Sync Service

The Inventory Sync Service is responsible for tracking inventory levels, managing product data, and providing accurate stock availability information.

**Key Responsibilities:**
- Product/Item data management
- Inventory level tracking across warehouses
- Stock reservation and allocation
- Real-time inventory updates
- Inventory reporting

**Technical Implementation:**
- Built with Go
- PostgreSQL database
- gRPC and REST APIs
- Containerized deployment

```mermaid
graph TD
    subgraph "Inventory Sync Service"
        API_Layer[API Layer]
        Services[Service Layer]
        Repositories[Repository Layer]
        DB[(PostgreSQL)]
        
        API_Layer --> |Process Requests| Services
        Services --> |Data Access| Repositories
        Repositories --> |CRUD Operations| DB
    end

    GRPC[gRPC Server] --> API_Layer
    REST[REST API] --> API_Layer
```

#### Service Components:

1. **gRPC Server**: Exposes inventory operations to other services
2. **REST API**: HTTP endpoints for client applications
3. **Service Layer**: Business logic for inventory operations
4. **Repository Layer**: Data access and persistence
5. **Database**: PostgreSQL for inventory and product data

### Logistics Engine

The Logistics Engine orchestrates the entire order lifecycle, from creation to fulfillment, while managing shipping, payments, and customer information.

**Key Responsibilities:**
- Order management
- Payment processing
- Shipping coordination
- Customer data management
- Inventory reservation (via Inventory Sync Service)

**Technical Implementation:**
- Built with Rust
- PostgreSQL database
- gRPC client for Inventory Service
- RabbitMQ for event handling
- Actor-based processing model

```mermaid
graph TD
    subgraph "Logistics Engine"
        API_Layer[API Layer]
        Services[Service Layer]
        Repositories[Repository Layer]
        DB[(PostgreSQL)]
        Messaging[Message Broker]
        
        API_Layer --> |Process Requests| Services
        Services --> |Data Access| Repositories
        Repositories --> |CRUD Operations| DB
        Services <--> |Pub/Sub| Messaging
    end
    
    GRPC[gRPC Client] <--> API_Layer
    REST[REST API] --> API_Layer
    RMQ[RabbitMQ] <--> Messaging
```

#### Service Components:

1. **gRPC Client**: Communicates with Inventory Sync Service
2. **REST API**: HTTP endpoints for client applications
3. **Service Layer**: Order and shipping business logic
4. **Repository Layer**: Data access and persistence
5. **Database**: PostgreSQL for orders, customers, and shipping
6. **Message Broker**: RabbitMQ integration for event processing

## Communication Patterns

### gRPC Communication

gRPC is used for synchronous service-to-service communication, particularly between the Logistics Engine and Inventory Sync Service.

```mermaid
sequenceDiagram
    participant LE as Logistics Engine
    participant IS as Inventory Sync Service
    
    LE->>IS: CheckAndReserveStock(order_id, items)
    IS->>IS: Validate stock availability
    IS->>IS: Reserve requested quantities
    IS-->>LE: StockReservationResponse
    
    LE->>IS: CommitReservation(reservation_id)
    IS->>IS: Convert reservation to allocation
    IS-->>LE: CommitReservationResponse
    
    LE->>IS: ReleaseReservedStock(reservation_id)
    IS->>IS: Release any held inventory
    IS-->>LE: ReleaseStockResponse
```

**Key gRPC Interactions:**

1. **Stock Reservation**: The Logistics Engine requests inventory reservations for orders
2. **Inventory Queries**: Checking current stock levels and availability
3. **Inventory Updates**: Committing or releasing reservations
4. **Product Information**: Retrieving product details needed for orders

### RabbitMQ Message Patterns

The system uses RabbitMQ for asynchronous event-based communication, particularly for order status updates and inventory changes.

```mermaid
graph LR
    subgraph "Message Patterns"
        LE[Logistics Engine] --> |Publish| EX[Exchange: order_events]
        EX --> |Routing Key| Q1[Queue: order_processing]
        EX --> |Routing Key| Q2[Queue: notification_service]
        
        Q1 --> |Consume| LE
        Q2 --> |Consume| NS[Notification Service]
    end
```

**Message Types:**

1. **OrderCreated**: When a new order is placed
2. **OrderStatusChanged**: When order status is updated
3. **InventoryReserved**: When stock is successfully reserved
4. **PaymentProcessed**: When payment is processed
5. **ShipmentCreated**: When a shipment is created

## Key Operations

### Inventory Management

```mermaid
flowchart TD
    A[Start] --> B{Item Exists?}
    B -->|No| C[Create Item]
    B -->|Yes| D[Update Item]
    C --> E[Set Initial Inventory Levels]
    D --> F[Adjust Inventory]
    E --> G[End]
    F --> G
```

### Order Processing

```mermaid
stateDiagram-v2
    [*] --> Created
    Created --> Processing: Payment Validated
    Processing --> ReservingStock: Begin Fulfillment
    ReservingStock --> Confirmed: Stock Reserved
    ReservingStock --> BackOrdered: Insufficient Stock
    Confirmed --> Shipped: Items Shipped
    Shipped --> Delivered: Delivery Confirmed
    Delivered --> [*]
    
    Created --> Cancelled: Customer Cancellation
    Processing --> Cancelled: Payment Failed
    BackOrdered --> Cancelled: Timeout/Customer Request
    BackOrdered --> ReservingStock: Stock Available
    Cancelled --> [*]
```

### Stock Reservation

```mermaid
sequenceDiagram
    participant C as Client
    participant LE as Logistics Engine
    participant IS as Inventory Sync Service
    participant DB as Inventory Database
    
    C->>LE: CreateOrder(items)
    LE->>LE: Validate order details
    LE->>IS: CheckAndReserveStock(order_items)
    IS->>DB: Check available quantities
    DB-->>IS: Current inventory levels
    
    alt Sufficient Stock
        IS->>DB: Create inventory_reservation records
        DB-->>IS: Reservation created
        IS-->>LE: ReservationSuccessful(reservation_id)
        LE->>LE: Update order status to CONFIRMED
        LE-->>C: OrderConfirmed
    else Insufficient Stock
        IS-->>LE: InsufficientStock(available_items)
        LE->>LE: Update order status to BACKORDERED
        LE-->>C: OrderBackordered(estimated_availability)
    end
```

## Data Models

### Inventory Sync Service Models

#### Item
- `id`: UUID - Primary Key
- `sku`: String - Unique product identifier
- `name`: String - Product name
- `description`: String - Product description
- `category`: String - Product category
- `attributes`: JSON - Product attributes
- `created_at`: Timestamp - Creation timestamp
- `updated_at`: Timestamp - Last update timestamp

#### Inventory Level
- `item_id`: UUID - Foreign Key to Item
- `warehouse_id`: UUID - Foreign Key to Warehouse
- `quantity`: Integer - Total quantity
- `reserved`: Integer - Reserved quantity
- `available`: Integer - Available quantity
- `last_updated`: Timestamp - Last update timestamp
- Primary Key: (item_id, warehouse_id)

#### Warehouse
- `id`: UUID - Primary Key
- `name`: String - Warehouse name
- `location`: String - Warehouse location
- `is_active`: Boolean - Warehouse status
- `customer_id`: UUID - Customer ID (optional)

### Logistics Engine Models

#### Order
- `id`: UUID - Primary Key
- `customer_id`: UUID - Foreign Key to Customer
- `status`: String - Order status
- `created_at`: Timestamp - Creation timestamp
- `updated_at`: Timestamp - Last update timestamp
- `total_amount`: Decimal - Order total
- `currency`: String - Currency code

#### Order Item
- `id`: UUID - Primary Key
- `order_id`: UUID - Foreign Key to Order
- `product_id`: UUID - Product ID
- `sku`: String - Product SKU
- `quantity`: Integer - Quantity ordered
- `unit_price`: Decimal - Price per unit
- `total_price`: Decimal - Total price

#### Inventory Reservation
- `id`: UUID - Primary Key
- `order_id`: UUID - Foreign Key to Order
- `item_id`: UUID - Foreign Key to Item
- `quantity`: Integer - Reserved quantity
- `status`: String - Reservation status
- `created_at`: Timestamp - Creation timestamp
- `expires_at`: Timestamp - Expiration timestamp

## API Reference

### Inventory Sync Service gRPC Methods

| Method | Description | Request | Response |
|--------|-------------|---------|----------|
| `CreateItem` | Creates a new item | CreateItemRequest | ItemResponse |
| `GetItem` | Retrieves item by ID | GetItemRequest | ItemResponse |
| `UpdateItem` | Updates an existing item | UpdateItemRequest | ItemResponse |
| `DeleteItem` | Deletes an item | DeleteItemRequest | DeleteItemResponse |
| `ListItems` | Lists items with pagination | ListItemsRequest | ListItemsResponse |
| `GetInventoryLevels` | Gets inventory levels | GetInventoryLevelsRequest | GetInventoryLevelsResponse |
| `AdjustInventory` | Adjusts inventory quantity | AdjustInventoryRequest | AdjustInventoryResponse |
| `AllocateInventory` | Allocates inventory for an order | AllocateInventoryRequest | AllocateInventoryResponse |
| `ReleaseInventory` | Releases allocated inventory | ReleaseInventoryRequest | ReleaseInventoryResponse |
| `CheckAndReserveStock` | Checks and reserves stock | StockReservationRequest | StockReservationResponse |
| `ReleaseReservedStock` | Releases reserved stock | ReleaseStockRequest | ReleaseStockResponse |
| `CommitReservation` | Commits a reservation | CommitReservationRequest | CommitReservationResponse |

### Logistics Engine gRPC Methods

| Method | Description | Request | Response |
|--------|-------------|---------|----------|
| `CreateOrder` | Creates a new order | CreateOrderRequest | OrderResponse |
| `GetOrder` | Retrieves order by ID | GetOrderRequest | OrderResponse |
| `UpdateOrderStatus` | Updates order status | UpdateOrderStatusRequest | OrderResponse |
| `ListOrders` | Lists orders with filtering | ListOrdersRequest | ListOrdersResponse |
| `StreamOrderUpdates` | Streams order status updates | StreamOrderUpdatesRequest | Stream<OrderStatusEvent> |

## Deployment Architecture

The system is designed for containerized deployment in Kubernetes.

```mermaid
graph TD
    subgraph "Kubernetes Cluster"
        subgraph "Inventory Namespace"
            IS_Pod1[Inventory Pod 1]
            IS_Pod2[Inventory Pod 2]
            IS_Svc[Inventory Service]
            
            IS_Pod1 --> IS_Svc
            IS_Pod2 --> IS_Svc
        end
        
        subgraph "Logistics Namespace"
            LE_Pod1[Logistics Pod 1]
            LE_Pod2[Logistics Pod 2]
            LE_Svc[Logistics Service]
            
            LE_Pod1 --> LE_Svc
            LE_Pod2 --> LE_Svc
        end
        
        subgraph "Database"
            PostgreSQL[(PostgreSQL)]
        end
        
        subgraph "Messaging"
            RabbitMQ[(RabbitMQ)]
        end
        
        Ingress[Ingress Controller] --> IS_Svc
        Ingress --> LE_Svc
        
        IS_Svc --> PostgreSQL
        LE_Svc --> PostgreSQL
        LE_Svc <--> RabbitMQ
    end
    
    Client[Client Applications] --> Ingress
```

## Monitoring and Observability

The system implements comprehensive monitoring and observability:

1. **Metrics**: Prometheus for metrics collection
2. **Logging**: Structured JSON logging for all services
3. **Tracing**: Jaeger for distributed tracing
4. **Alerting**: Prometheus Alertmanager
5. **Dashboards**: Grafana dashboards for visualization

```mermaid
graph LR
    subgraph "Services"
        LE[Logistics Engine]
        IS[Inventory Service]
    end
    
    subgraph "Monitoring"
        Prometheus[(Prometheus)]
        Jaeger[(Jaeger)]
        Grafana[Grafana]
    end
    
    LE --> |Metrics| Prometheus
    IS --> |Metrics| Prometheus
    LE --> |Traces| Jaeger
    IS --> |Traces| Jaeger
    Prometheus --> Grafana
    Jaeger --> Grafana
```

This architecture provides a robust, scalable, and maintainable platform for handling complex inventory and logistics operations with high reliability and performance. 