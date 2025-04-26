# Synkro System Architecture

## Overview

Synkro is a comprehensive microservice-based application designed with a modern cloud-native architecture. The system consists of several interconnected services that communicate with each other through well-defined APIs, event-driven patterns, and container orchestration. This document provides a detailed description of the architecture, service interactions, and technical implementation details based on the current system implementation.

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
        FrontendDashboard["Next.js Dashboard App"]:::frontend
        FrontendAuth["Auth Frontend (Vite)"]:::frontend
        FrontendLanding["Landing Page (Astro)"]:::frontend
        
        subgraph UIComponents["UI Components"]
            AtomicDesign["Atomic Design System"]:::frontend
            DashboardUI["Dashboard & Analytics"]:::frontend
            InventoryUI["Inventory Management"]:::frontend
            OrderUI["Order Processing"]:::frontend
        end
        
        FrontendDashboard --> AtomicDesign
        FrontendAuth --> AtomicDesign
        FrontendLanding --> AtomicDesign
        AtomicDesign --> DashboardUI & InventoryUI & OrderUI
    end
    
    %% Backend Services
    subgraph BackendServices["Backend Services"]
        subgraph APIGateway["API Gateway & Auth (NestJS)"]
            Auth["OAuth2/JWT Auth"]:::backend
            RBAC["RBAC Authorization"]:::backend
            RateLimit["Rate Limiting"]:::backend
            APIProxy["Load Balancer(In Progress)"]:::backend 
        end
        
        subgraph NotificationService["Notification Service (Node.js/Bun)"]
            NotificationEngine["Notification Engine"]:::backend
            EventHandler["Event Handler"]:::backend
            PushNotifications["Push Notifications"]:::backend
            EmailService["Email Service"]:::backend
        end
        
        subgraph MLService["AI/ML Service (Python/FastAPI)"]
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
    
    %% Database Communications
    MLService -->|"ML Data Operations"|PostgreSQL
    APIGateway -->|"User & Auth Data"|PostgreSQL
    
    %% Cache Communications
    APIGateway -->|"Session & Token Cache"|Redis
    
    %% Analytics & Search
    MLService -->|"Analytics Queries"|ElasticSearch
    
    %% Monitoring
    BackendServices -.->|"Logs"|ELK
    BackendServices -.->|"Metrics"|Prometheus
    Prometheus -->|"Visualize"|Grafana
    BackendServices -.->|"Traces"|Jaeger
    
    %% Frontend to Backend
    Frontend -->|"REST APIs"|APIGateway
    APIGateway -->|"Route Requests"|MLService & NotificationService
    
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

2. **Frontend Auth** (`frontend-auth`)
   - Vite-based authentication frontend
   - Handles user login and registration flows
   - Secure token storage and management
   - Integration with API Gateway Auth
   - Responsive design with Tailwind CSS

3. **Frontend Landing** (`frontend-landing`)
   - Astro-based landing page
   - Fast, static site generation
   - Marketing and product information
   - Seamless transition to authentication flow
   - Optimized for performance and SEO

### Backend Services

1. **API Gateway Auth** (`api-gateway-auth`)
   - NestJS application serving as the authentication gateway
   - OAuth2/JWT-based authentication and authorization
   - RBAC (Role-Based Access Control)
   - Rate limiting and API security 
   - API proxy and load balancing
   - Connects to PostgreSQL for user data

2. **Notification Service** (`notification-service`) (In Progress)
   - Lightweight Node.js/Bun-based notification system
   - Event-driven architecture
   - Notification engine for orchestration
   - Event queue handler
   - Multiple notification channels:
     - Push notifications
     - Email service

3. **AI/ML Service** (`ai-ml-predictions`)
   - Python-based prediction service with FastAPI
   - Demand forecasting models
   - Time series analysis
   - Stock level optimization
   - Model training and validation
   - Direct PostgreSQL integration for data access

### Data Layer

1. **PostgreSQL**
   - Primary database for orders and inventory
   - User authentication data
   - ML model data and predictions
   - Schema migrations and data versioning

2. **Redis**
   - Caching layer
   - Session management
   - Authentication token storage
   - Rate limiting implementation

3. **Elasticsearch**
   - Analytics and search capabilities
   - ML service data storage
   - Log aggregation and analysis
   - Part of the ELK stack for observability

### Observability Stack

1. **ELK Stack**
   - Elasticsearch for log storage and indexing
   - Logstash for log processing and transformation
   - Kibana for log visualization and dashboards
   - Centralized logging across all services

2. **Prometheus & Grafana**
   - Metrics collection and monitoring
   - Performance visualization
   - System health dashboards
   - Alerting capabilities

## Detailed Architecture

### Authentication Flow

1. **User Registration**:
   - User submits registration data to `frontend-auth`
   - Frontend validates and sends data to API Gateway Auth
   - API Gateway creates user record in PostgreSQL database
   - JWT token is generated and returned to the frontend
   - Frontend stores token securely

2. **User Login**:
   - User enters credentials in `frontend-auth`
   - Credentials are sent to API Gateway Auth
   - API validates credentials against database
   - Valid credentials lead to JWT token generation
   - Token is returned to frontend and stored securely

3. **Protected Routes**:
   - Dashboard routes are protected by middleware
   - Token is checked on both server-side and client-side
   - Unauthenticated users are redirected to login

### Service Communication

1. **REST API Integration**
   - Authentication through API Gateway
   - Protected routes and endpoints
   - Standardized error handling and responses

2. **Event-Driven Communication**
   - Event-driven notification system
   - Multiple notification channels
   - Async processing of notification requests

### AI/ML Service Architecture

1. **Model Management**
   - Multiple prediction models available:
     - Demand forecasting
     - Stockout prediction
     - Stock optimization
   - Model versioning and selection
   - Dynamic model loading and prediction

2. **Data Processing**
   - Direct PostgreSQL integration
   - Time series data processing
   - Feature engineering and selection
   - Batch and real-time prediction capabilities

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

    ML_PREDICTIONS {
        uuid id PK
        uuid item_id FK
        string prediction_type
        jsonb prediction_data
        decimal confidence
        timestamp created_at
        timestamp valid_until
        string status
        string model_version
    }
    
    USERS {
        uuid id PK
        string username
        string email
        string password_hash
        string role
        timestamp created_at
        timestamp updated_at
        boolean active
    }
    
    AUTH_TOKENS {
        uuid id PK
        uuid user_id FK
        string token_value
        timestamp expires_at
        timestamp created_at
        boolean revoked
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
    ML_PREDICTIONS ||--|| INVENTORY_ITEMS : "predicts_for"
    ORDER_ITEMS ||--|| ORDERS : "part_of"
    ORDER_STATUS_HISTORY ||--|| ORDERS : "tracks"
    ORDERS ||--|| CUSTOMERS : "placed_by"
    PAYMENT_INFO ||--|| ORDERS : "belongs_to"
    SHIPPING_INFO ||--|| ORDERS : "belongs_to"
    AUTH_TOKENS ||--|| USERS : "belongs_to"
```

### Key Entity Relationships

1. **User Authentication**
   - User accounts and authentication tokens
   - Security and access control

2. **Inventory Management**
   - Inventory tracking across warehouses
   - Item reservation and transaction history

3. **ML Predictions**
   - AI/ML model outputs for demand forecasting
   - Prediction confidence tracking

4. **Order Management**
   - Customer orders and line items
   - Order status tracking
   - Payment and shipping details

5. **Database Management**
   - Schema versioning and migrations

## Core System Flows

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend Auth
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

## Conclusion

The Synkro system architecture follows modern microservice principles with a focus on:

- Service independence through well-defined APIs
- Clear separation of concerns with specialized services
- High performance and scalability
- Comprehensive monitoring with the ELK stack
- Security-first approach with OAuth2/JWT
- Event-driven architecture for notifications
- AI/ML integration for predictive analytics

This architecture enables independent development, testing, and deployment of services while maintaining system cohesion through well-defined interfaces and protocols.

For Kubernetes deployment details, please refer to [K8S.md](K8S.md).