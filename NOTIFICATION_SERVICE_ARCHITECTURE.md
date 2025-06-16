# Notification Service Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        FD[Frontend Dashboard]
        FL[Frontend Landing]
        FA[Frontend Auth]
    end

    subgraph "Notification Service"
        NS[Notification Service]
        subgraph "Core Components"
            NM[Notification Manager]
            QM[Queue Manager]
            TM[Template Manager]
        end
        subgraph "Channels"
            EM[Email Channel]
            SM[SMS Channel]
            WM[WebSocket Channel]
            PM[Push Channel]
        end
    end

    subgraph "Message Queue"
        RMQ[RabbitMQ]
    end

    subgraph "Storage"
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
    end

    subgraph "External Services"
        ES[Email Service]
        SS[SMS Service]
        PS[Push Service]
    end

    %% Client to Service
    FD --> NS
    FL --> NS
    FA --> NS

    %% Service Internal Flow
    NS --> NM
    NM --> QM
    NM --> TM

    %% Queue Management
    QM --> RMQ
    RMQ --> Channels

    %% Channel Distribution
    Channels --> EM
    Channels --> SM
    Channels --> WM
    Channels --> PM

    %% External Service Integration
    EM --> ES
    SM --> SS
    PM --> PS

    %% Storage Integration
    NS --> DB
    NS --> Cache

    %% Styling
    classDef client fill:#bbf,stroke:#333,stroke-width:2px
    classDef service fill:#bfb,stroke:#333,stroke-width:2px
    classDef queue fill:#fbb,stroke:#333,stroke-width:2px
    classDef storage fill:#f9f,stroke:#333,stroke-width:2px
    classDef external fill:#fbf,stroke:#333,stroke-width:2px

    class FD,FL,FA client
    class NS,NM,QM,TM,EM,SM,WM,PM service
    class RMQ queue
    class DB,Cache storage
    class ES,SS,PS external
```

## Architecture Components

### Client Layer
- **Frontend Dashboard**: Main application interface
- **Frontend Landing**: Public-facing interface
- **Frontend Auth**: Authentication interface

### Notification Service Core
- **Notification Manager**: Orchestrates notification processing
- **Queue Manager**: Handles message queuing and distribution
- **Template Manager**: Manages notification templates

### Notification Channels
- **Email Channel**: Email notifications
- **SMS Channel**: Text message notifications
- **WebSocket Channel**: Real-time notifications
- **Push Channel**: Mobile push notifications

### Message Queue
- **RabbitMQ**: Message broker for async processing

### Storage
- **PostgreSQL**: Persistent storage for notifications
- **Redis Cache**: Caching layer for templates and configurations

### External Services
- **Email Service**: Email delivery service
- **SMS Service**: SMS delivery service
- **Push Service**: Push notification delivery service

## Key Features
- Real-time notification delivery
- Multi-channel support
- Template-based notifications
- Asynchronous processing
- High availability
- Scalable architecture
- Message persistence
- Delivery tracking
- Rate limiting
- Retry mechanisms 