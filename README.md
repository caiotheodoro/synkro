# Synkro System Architecture

## Overview

Synkro is a comprehensive microservice-based application designed with a modern cloud-native architecture. The system consists of several interconnected services that communicate with each other through well-defined APIs and gRPC protocols. This document provides a detailed description of the architecture, service interactions, and technical implementation details.

## Architecture Diagram

```mermaid
graph TB
    %% Define styles
    classDef frontend fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e
    classDef backend fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d
    classDef database fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    classDef queue fill:#fae8ff,stroke:#c026d3,stroke-width:2px,color:#701a75
    classDef monitoring fill:#ffe4e6,stroke:#e11d48,stroke-width:2px,color:#881337
    classDef cache fill:#e0f7fa,stroke:#0891b2,stroke-width:2px,color:#164e63
    
    %% Frontend Layer
    subgraph Frontend["Frontend Layer"]
        NextApp["Next.js Dashboard App"]:::frontend
        
        subgraph UIComponents["UI Components"]
            AtomicDesign["Atomic Design System"]:::frontend
            DashboardUI["Dashboard & Analytics"]:::frontend
            InventoryUI["Inventory Management"]:::frontend
            OrderUI["Order Processing"]:::frontend
        end
        
        NextApp --> AtomicDesign
        AtomicDesign --> DashboardUI & InventoryUI & OrderUI
    end
    
    %% Backend Services
    subgraph BackendServices["Backend Services"]
        subgraph APIGateway["API Gateway & Auth (NestJS)"]
            Auth["OAuth2/JWT Auth"]:::backend
            RBAC["RBAC Authorization"]:::backend
            RateLimit["Rate Limiting"]:::backend
            APIProxy["Load Balancer"]:::backend
        end
        
        subgraph LogisticsEngine["Logistics Engine (Rust)"]
            OrderProcessor["Order Processing"]:::backend
            InventoryManager["Inventory Management"]:::backend
            RouteOptimizer["Route Optimization"]:::backend
            GRPCClient["gRPC Client (Tonic)"]:::backend
        end
        
        subgraph InventorySync["Inventory Sync Service (Go)"]
            GRPCServer["gRPC Server :50052"]:::backend
            StockManager["Stock Management"]:::backend
            ReservationSystem["Reservation System"]:::backend
            StreamingService["Real-time Updates"]:::backend
        end
        
        subgraph NotificationService["Notification Service (Node.js)"]
            NotificationEngine["Notification Engine"]:::backend
            EventHandler["Event Handler"]:::backend
            PushNotifications["Push Notifications"]:::backend
            EmailService["Email Service"]:::backend
        end
        
        subgraph MLService["AI/ML Service (Python)"]
            Forecasting["Demand Forecasting"]:::backend
            TimeSeriesAnalysis["Time Series Analysis"]:::backend
            StockOptimizer["Stock Optimization"]:::backend
            ModelTraining["Model Training"]:::backend
        end
    end
    
    %% Data Layer
    subgraph DataLayer["Data Layer"]
        PostgreSQL[("PostgreSQL\nOrders & Inventory")]:::database
        Redis[("Redis Cache")]:::cache
        ElasticSearch[("Elasticsearch\nAnalytics & Search")]:::database
        RabbitMQ{"RabbitMQ\nEvent Bus"}:::queue
    end
    
    %% Observability
    subgraph Observability["Observability Stack"]
        ELK["ELK Stack"]:::monitoring
        Prometheus["Prometheus"]:::monitoring
        Grafana["Grafana"]:::monitoring
        Jaeger["Jaeger Tracing"]:::monitoring
    end
    
    %% Service Communications
    
    %% gRPC Communication
    GRPCClient <-.->|"gRPC Streaming\n- Stock Reservation\n- Inventory Updates\n- Stock Release"|GRPCServer
    
    %% Event Bus Communications
    LogisticsEngine -->|"Order Events"|RabbitMQ
    InventorySync -->|"Stock Updates"|RabbitMQ
    NotificationService -->|"Consume Events"|RabbitMQ
    
    %% Database Communications
    InventorySync -->|"CRUD Operations"|PostgreSQL
    LogisticsEngine -->|"Order Management"|PostgreSQL
    APIGateway -->|"User & Auth Data"|PostgreSQL
    
    %% Cache Communications
    InventorySync -->|"Cache Stock Levels"|Redis
    APIGateway -->|"Session & Token Cache"|Redis
    
    %% Analytics & Search
    MLService -->|"Analytics Queries"|ElasticSearch
    
    %% Monitoring
    BackendServices -.->|"Logs"|ELK
    BackendServices -.->|"Metrics"|Prometheus
    Prometheus -->|"Visualize"|Grafana
    BackendServices -.->|"Traces"|Jaeger
    
    %% Frontend to Backend
    Frontend -->|"REST/GraphQL"|APIGateway
    APIGateway -->|"Route Requests"|LogisticsEngine & InventorySync
    
    %% Link Styles
    linkStyle 0 stroke:#0284c7,stroke-width:2px;
    linkStyle 1 stroke:#16a34a,stroke-width:2px;
    linkStyle 2 stroke:#16a34a,stroke-width:2px;
    linkStyle 3 stroke:#c026d3,stroke-width:2px;
```

## System Components

The Synkro system is divided into the following key components:

### Frontend Layer

1. **Frontend Dashboard** (`frontend-dashboard`)
   - Next.js application for the main interface
   - Implements Atomic Design principles
   - Uses TailwindCSS with Neobrutalism design
   - Protected routes with authentication
   - Key interfaces:
     - Dashboard & Analytics UI
     - Inventory Management UI
     - Order Processing UI

### Backend Services

1. **API Gateway Auth** (`api-gateway-auth`)
   - NestJS application serving as the authentication gateway
   - OAuth2/JWT-based authentication and authorization
   - RBAC (Role-Based Access Control)
   - Rate limiting and API security
   - API proxy and load balancing
   - Connects to PostgreSQL for user data

2. **Logistics Engine** (`logistics-engine`)
   - Written in Rust for high performance
   - Order processing and validation
   - Inventory state management
   - Route optimization and delivery planning
   - gRPC client for inventory communication
   - Event publishing through RabbitMQ

3. **Inventory Sync Service** (`inventory-sync-service`)
   - Written in Go for concurrent operations
   - gRPC server (port 50052)
   - Stock management and allocation
   - Reservation and locking system
   - Real-time stock updates streaming
   - Event publishing through RabbitMQ

4. **Notification Service** (`notification-service`)
   - Node.js-based notification system
   - Event-driven architecture
   - Notification engine for orchestration
   - Event queue handler
   - Multiple notification channels:
     - Push notifications (FCM/APNS)
     - Email service (SMTP)

5. **AI/ML Service** (`ai-ml-predictions`)
   - Python-based prediction service
   - Demand forecasting models
   - Time series analysis
   - Stock level optimization
   - Model training and validation

### Data Layer

1. **PostgreSQL**
   - Primary database for orders and inventory
   - User authentication data
   - Transactional data storage

2. **Redis**
   - Caching layer
   - Session management
   - Real-time data storage

3. **Elasticsearch**
   - Analytics and search capabilities
   - ML service data storage
   - Log aggregation

4. **RabbitMQ**
   - Event bus for service communication
   - Message queue for async operations
   - Event sourcing backbone

### Observability Stack

1. **ELK Stack**
   - Centralized logging
   - Log analysis and visualization

2. **Prometheus**
   - Metrics collection
   - Performance monitoring

3. **Grafana**
   - Metrics visualization
   - Dashboard creation

4. **Jaeger**
   - Distributed tracing
   - Performance analysis

## Detailed Architecture

### Authentication Flow

1. **User Registration**:
   - User submits registration data to `frontend-auth`
   - Frontend validates and sends data to API Gateway Auth
   - API Gateway creates user record in PostgreSQL database
   - User credentials are securely stored (password hashed with bcrypt)
   - JWT token is generated and returned to the frontend
   - Frontend stores token in localStorage

2. **User Login**:
   - User enters credentials in `frontend-auth`
   - Credentials are sent to API Gateway Auth
   - API validates credentials against database
   - Valid credentials lead to JWT token generation
   - Token is returned to frontend and stored in localStorage

3. **Token Validation**:
   - Apps validate tokens by sending them to API Gateway Auth
   - API Gateway verifies token integrity and expiration
   - Invalidated tokens (from logout) are rejected
   - Validation results returned to requesting service

4. **Protected Routes**:
   - Dashboard routes are protected by middleware
   - Token is checked on both server-side (middleware.ts) and client-side
   - Unauthenticated users are redirected to login

### Service Communication

#### gRPC Integration

1. **Logistics Engine to Inventory Sync**
   - Bidirectional gRPC streaming
   - Key operations:
     - Stock reservation
     - Inventory updates
     - Stock release
   - Protocol Buffer definitions
   - Connection on port 50052

#### Event-Driven Communication

1. **RabbitMQ Events**
   - Order events from Logistics Engine
   - Stock updates from Inventory Sync
   - Notification events consumption
   - Async communication between services

#### REST/GraphQL APIs

1. **Frontend to Backend**
   - REST/GraphQL communication
   - Authentication through API Gateway
   - Protected routes and endpoints

## Entity Relationships

```mermaid
erDiagram
    INVENTORY_LEVELS {
        uuid item_id PK
        uuid warehouse_id FK
        int quantity
        int reserved
        int available
        timestamp last_updated
    }

    INVENTORY_ITEMS {
        uuid id PK
        string sku
        string name
        string description
        string category
        jsonb attributes
        uuid warehouse_id FK
        timestamp created_at
        timestamp updated_at
        decimal price
        int overstock_threshold
        int low_stock_threshold
        int quantity
    }

    WAREHOUSES {
        uuid id PK
        string code
        string name
        string address_line1
        string address_line2
        string state
        string postal_code
        string country
        string contact_name
        string contact_phone
        string contact_email
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_RESERVATIONS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        string status
        timestamp created_at
        timestamp expires_at
        timestamp updated_at
    }

    INVENTORY_TRANSACTIONS {
        uuid id PK
        uuid item_id FK
        string type
        string reference
        uuid warehouse_id FK
        timestamp timestamp
        uuid user_id FK
        timestamp updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        string sku
        string name
        int quantity
        decimal unit_price
        decimal total_price
        timestamp created_at
        timestamp updated_at
        uuid product_id FK
    }

    ORDER_STATUS_HISTORY {
        uuid id PK
        uuid order_id FK
        string previous_status
        string new_status
        string status_notes
        string changed_by
        timestamp created_at
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        string status
        decimal total_amount
        string currency
        string tracking_number
        string notes
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMERS {
        uuid id PK
        string name
        string email
        string phone
        timestamp created_at
        timestamp updated_at
    }

    PAYMENT_INFO {
        uuid id PK
        uuid order_id FK
        string payment_method
        string transaction_id
        string reference
        string currency
        timestamp payment_date
        timestamp created_at
        timestamp updated_at
        string status
    }

    SHIPPING_INFO {
        uuid id PK
        uuid order_id FK
        string address_line1
        string address_line2
        string city
        string state
        string postal_code
        string country
        string recipient_name
        string recipient_phone
        string shipping_method
        decimal shipping_cost
        timestamp created_at
        timestamp updated_at
        string tracking_number
        string carrier
        string status
        timestamp expected_delivery
        timestamp actual_delivery
    }

    SCHEMA_MIGRATIONS {
        string version PK
        string description
        timestamp installed_on
        boolean success
        string checksum
        timestamp execution_time
    }

    INVENTORY_LEVELS ||--|| WAREHOUSES : "stored_in"
    INVENTORY_LEVELS ||--|| INVENTORY_ITEMS : "tracks"
    INVENTORY_ITEMS ||--|| WAREHOUSES : "belongs_to"
    INVENTORY_RESERVATIONS ||--|| INVENTORY_ITEMS : "reserves"
    INVENTORY_TRANSACTIONS ||--|| INVENTORY_ITEMS : "affects"
    INVENTORY_TRANSACTIONS ||--|| WAREHOUSES : "occurs_in"
    ORDER_ITEMS ||--|| ORDERS : "part_of"
    ORDER_STATUS_HISTORY ||--|| ORDERS : "tracks"
    ORDERS ||--|| CUSTOMERS : "placed_by"
    PAYMENT_INFO ||--|| ORDERS : "belongs_to"
    SHIPPING_INFO ||--|| ORDERS : "belongs_to"
```

### Entity Relationships Description

1. **Inventory Management**
   - `INVENTORY_LEVELS` tracks the quantity of items in each warehouse
   - `INVENTORY_ITEMS` stores product information and thresholds
   - `WAREHOUSES` contains warehouse location and contact details
   - `INVENTORY_RESERVATIONS` manages temporary item holds
   - `INVENTORY_TRANSACTIONS` records all inventory movements

2. **Order Management**
   - `ORDERS` stores main order information
   - `ORDER_ITEMS` contains individual items in each order
   - `ORDER_STATUS_HISTORY` tracks order status changes
   - `CUSTOMERS` stores customer information
   - `PAYMENT_INFO` manages payment details
   - `SHIPPING_INFO` handles shipping details

3. **Database Management**
   - `SCHEMA_MIGRATIONS` tracks database schema changes

### Key Relationships

- Each inventory item belongs to a warehouse
- Inventory levels are tracked per item per warehouse
- Orders contain multiple order items
- Each order has associated payment and shipping information
- Order status changes are tracked historically
- Inventory transactions record all stock movements
- Inventory reservations temporarily hold stock for orders

## Detailed System Communications

### Order Processing Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend
    participant AG as API Gateway
    participant LE as Logistics Engine
    participant IS as Inventory Sync
    participant NS as Notification
    participant RMQ as RabbitMQ
    participant DB as PostgreSQL
    participant RC as Redis Cache

    %% Order Creation
    C->>+FE: Create Order
    FE->>+AG: POST /api/orders
    AG->>AG: Validate JWT
    AG->>+LE: Create Order Request
    
    %% Stock Check
    LE->>+IS: gRPC: CheckAndReserveStock
    IS->>DB: Check Stock
    IS->>RC: Reserve Stock
    IS-->>-LE: Stock Reserved
    
    %% Order Processing
    LE->>DB: Save Order
    LE->>RMQ: Publish OrderCreated
    LE-->>-AG: Order Created
    AG-->>-FE: Order Confirmation
    FE-->>-C: Success Response
    
    %% Async Processing
    RMQ->>NS: OrderCreated Event
    NS->>C: WebSocket: Order Status
    NS->>RMQ: Publish Notification
    
    %% Stock Update
    IS->>RMQ: Publish StockUpdated
    RMQ->>NS: StockUpdated Event
    NS->>C: WebSocket: Stock Update
```

### Inventory Management Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend
    participant AG as API Gateway
    participant IS as Inventory Sync
    participant LE as Logistics Engine
    participant ML as ML Service
    participant ES as Elasticsearch
    participant DB as PostgreSQL
    participant RC as Redis Cache

    %% Stock Level Check
    C->>+FE: View Inventory
    FE->>+AG: GET /api/inventory
    AG->>+IS: Get Stock Levels
    IS->>RC: Check Cache
    
    alt Cache Hit
        RC-->>IS: Return Cached Data
    else Cache Miss
        IS->>DB: Query Stock Levels
        IS->>RC: Update Cache
        DB-->>IS: Stock Data
    end
    
    IS-->>-AG: Stock Levels
    AG-->>-FE: Inventory Data
    FE-->>-C: Display Inventory

    %% ML Predictions
    ML->>DB: Fetch Historical Data
    ML->>ES: Process Analytics
    ML->>IS: Update Predictions
    
    %% Real-time Updates
    IS->>FE: gRPC Stream: Stock Updates
    FE->>C: Live Updates
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend
    participant AG as API Gateway
    participant DB as PostgreSQL
    participant RC as Redis Cache

    %% Login Flow
    C->>+FE: Login Request
    FE->>+AG: POST /auth/login
    AG->>DB: Validate Credentials
    AG->>RC: Store Session
    AG-->>-FE: JWT Token
    FE-->>-C: Login Success

    %% Token Validation
    C->>+FE: Protected Request
    FE->>+AG: Request + JWT
    AG->>RC: Validate Session
    
    alt Valid Token
        AG->>AG: Verify Permissions
        AG-->>FE: Allow Request
    else Invalid Token
        AG-->>FE: 401 Unauthorized
        FE->>C: Redirect to Login
    end
```

### Event Processing Flow

```mermaid
flowchart TB
    %% Styles
    classDef publisher fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    classDef subscriber fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    classDef queue fill:#fae8ff,stroke:#c026d3,stroke-width:2px
    classDef processor fill:#ffe4e6,stroke:#e11d48,stroke-width:2px

    %% Publishers
    LE[Logistics Engine]:::publisher
    IS[Inventory Sync]:::publisher
    
    %% Queue
    subgraph RMQ[RabbitMQ Event Bus]
        direction TB
        OE[Order Events]:::queue
        SE[Stock Events]:::queue
        NE[Notification Events]:::queue
    end
    
    %% Subscribers
    NS[Notification Service]:::subscriber
    ML[ML Service]:::processor
    
    %% Event Flows
    LE -->|"OrderCreated\nOrderUpdated\nOrderCancelled"| OE
    IS -->|"StockReserved\nStockReleased\nLowStock"| SE
    
    OE --> NS & ML
    SE --> NS & ML
    
    NS -->|"Process & Send"| NE
    ML -->|"Process & Predict"| SE
```

### Cache Strategy Flow

```mermaid
flowchart TB
    %% Styles
    classDef service fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    classDef cache fill:#e0f7fa,stroke:#0891b2,stroke-width:2px
    classDef db fill:#fef3c7,stroke:#d97706,stroke-width:2px
    
    %% Services
    IS[Inventory Sync]:::service
    AG[API Gateway]:::service
    LE[Logistics Engine]:::service
    
    %% Cache Layers
    subgraph Redis[Redis Cache]
        direction TB
        SC[Stock Cache]:::cache
        SC_TTL[["TTL: 5m"]]
        
        AC[Auth Cache]:::cache
        AC_TTL[["TTL: 1h"]]
        
        RC[Rate Limit Cache]:::cache
        RC_TTL[["TTL: 1m"]]
    end
    
    %% Database
    DB[(PostgreSQL)]:::db
    
    %% Cache Flows
    IS -->|"Read/Write"| SC
    AG -->|"Read/Write"| AC
    AG -->|"Rate Limiting"| RC
    
    SC -->|"Cache Miss"| DB
    AC -->|"Cache Miss"| DB
    
    %% Invalidation
    LE -.->|"Invalidate"| SC
    AG -.->|"Invalidate"| AC
```

### ML Service Data Flow

```mermaid
flowchart TB
    %% Styles
    classDef source fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    classDef process fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    classDef storage fill:#fef3c7,stroke:#d97706,stroke-width:2px
    classDef output fill:#ffe4e6,stroke:#e11d48,stroke-width:2px
    
    %% Data Sources
    subgraph Sources[Data Sources]
        direction TB
        OH[Order History]:::source
        SL[Stock Levels]:::source
        TD[Transaction Data]:::source
    end
    
    %% Processing
    subgraph ML[ML Processing]
        direction TB
        DP[Data Preprocessing]:::process
        FA[Feature Analysis]:::process
        MT[Model Training]:::process
        MP[Model Prediction]:::process
    end
    
    %% Storage
    ES[(Elasticsearch)]:::storage
    
    %% Outputs
    subgraph Predictions[Predictions]
        direction TB
        DF[Demand Forecast]:::output
        SO[Stock Optimization]:::output
        RP[Reorder Points]:::output
    end
    
    %% Flows
    Sources --> DP
    DP --> FA
    FA --> MT
    MT --> MP
    MP --> Predictions
    
    %% Storage Flows
    Sources --> ES
    ML -.-> ES
    Predictions --> ES
```

These additional diagrams provide detailed insights into:
1. Order processing sequence with gRPC and event communication
2. Inventory management with caching strategy
3. Authentication and authorization flow
4. Event processing and message queue patterns
5. Cache strategy with TTLs and invalidation
6. ML service data processing and predictions

Each diagram uses consistent color coding and styling to maintain readability and shows the specific interactions between services, including:
- Synchronous communications (REST, gRPC)
- Asynchronous events (RabbitMQ)
- Caching strategies (Redis)
- Data persistence (PostgreSQL)
- Analytics and ML processing (Elasticsearch)

## Conclusion

The Synkro system architecture follows modern microservice principles with a focus on:

- Service independence through gRPC and event-driven communication
- Clear separation of concerns with specialized services
- High performance with Rust and Go implementations
- Scalability through microservices architecture
- Comprehensive monitoring and observability
- Security-first approach with OAuth2/JWT
- Real-time capabilities with gRPC streaming
- Event-driven architecture using RabbitMQ
- AI/ML integration for predictive analytics

This architecture enables independent development, testing, and deployment of services while maintaining system cohesion through well-defined interfaces and protocols.