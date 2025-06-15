# Kubernetes Architecture

```mermaid
graph TB
    subgraph "Ingress Layer"
        I[Ingress Controller]
    end

    subgraph "Frontend Services"
        FL[Frontend Landing]
        FD[Frontend Dashboard]
        FA[Frontend Auth]
    end

    subgraph "Backend Services"
        LE[Logistics Engine]
        IS[Inventory Sync]
        NS[Notification Service]
        AG[API Gateway Auth]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        ELK[ELK Stack]
    end

    subgraph "AI/ML Services"
        AI[AI/ML Predictions]
    end

    %% Ingress to Frontend
    I --> FL
    I --> FD
    I --> FA

    %% Frontend to Backend
    FL --> AG
    FD --> AG
    FA --> AG

    %% Backend Services Communication
    AG --> LE
    AG --> IS
    AG --> NS

    %% Backend to Data Layer
    LE --> DB
    IS --> DB
    NS --> DB

    %% Logging and Monitoring
    LE --> ELK
    IS --> ELK
    NS --> ELK

    %% AI/ML Integration
    LE --> AI
    IS --> AI

    %% Styling
    classDef ingress fill:#f9f,stroke:#333,stroke-width:2px
    classDef frontend fill:#bbf,stroke:#333,stroke-width:2px
    classDef backend fill:#bfb,stroke:#333,stroke-width:2px
    classDef data fill:#fbb,stroke:#333,stroke-width:2px
    classDef ai fill:#fbf,stroke:#333,stroke-width:2px

    class I ingress
    class FL,FD,FA frontend
    class LE,IS,NS,AG backend
    class DB,ELK data
    class AI ai
```

## Architecture Components

### Ingress Layer
- **Ingress Controller**: Manages external access to services, handles SSL termination, and routes traffic

### Frontend Services
- **Frontend Landing**: Public-facing landing page
- **Frontend Dashboard**: Main application dashboard
- **Frontend Auth**: Authentication interface

### Backend Services
- **Logistics Engine**: Core business logic and orchestration
- **Inventory Sync**: Real-time inventory management
- **Notification Service**: Event-driven notifications
- **API Gateway Auth**: Authentication and authorization gateway

### Data Layer
- **PostgreSQL**: Primary database
- **ELK Stack**: Logging and monitoring

### AI/ML Services
- **AI/ML Predictions**: Machine learning and predictive analytics

## Key Features
- Horizontal scaling of services
- Load balancing
- Service discovery
- Health monitoring
- Automated deployments
- Resource management
- High availability 