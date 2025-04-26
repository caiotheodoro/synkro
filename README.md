# Synkro

Synkro is a comprehensive microservice-based inventory management and prediction system designed with a modern cloud-native architecture. It combines powerful inventory tracking capabilities with AI-driven demand forecasting to optimize stock levels and streamline operations.


## 🚀 Features

- **Inventory Management** - Track inventory levels across multiple warehouses
- **Order Processing** - Manage orders and track fulfillment status
- **AI-Powered Forecasting** - Predict demand and optimize stock levels
- **Real-time Notifications** - Get alerts for low stock and other events
- **Role-Based Access Control** - Manage user permissions securely
- **Comprehensive Analytics** - Make data-driven decisions

## 📋 System Status

| Component | Status | Description |
|-----------|--------|-------------|
| Frontend Dashboard | ✅ Complete | Next.js application with Atomic Design and Neobrutalism |
| Frontend Auth | ✅ Complete | Vite-based authentication frontend |
| Frontend Landing | ✅ Complete | Astro-based marketing site |
| API Gateway & Auth | ✅ Complete | NestJS application handling authentication and API routing |
| AI/ML Service | ✅ Complete | Python/FastAPI service for demand forecasting |
| Notification Service | 🚧 In Progress | Event-driven notification system |
| Observability Stack | ✅ Complete | ELK Stack for logging and monitoring |
| Data Layer | ✅ Complete | PostgreSQL, Redis, and Elasticsearch |

## 🏗️ Architecture

Synkro follows a microservice architecture with several interconnected components:

```
Frontend Layer → API Gateway → Backend Services → Data Layer
                     ↓
              Observability Stack
```

The system is designed for scalability, resilience, and maintainability.

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 🛠️ Deployment

Synkro is deployed using Kubernetes for container orchestration, providing:

- Scalability through replica management
- High availability with multi-pod deployments
- Resource allocation and limits
- Health monitoring and self-healing
- Service discovery and load balancing

For detailed deployment instructions, see [K8S.md](K8S.md).

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose for local development
- Kubernetes cluster for production deployment
- Node.js 18+ for frontend development
- Python 3.9+ for ML service development

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/synkro.git
cd synkro

# Start the development environment
docker-compose up -d

# Access the application
open http://localhost:3000
```

### Kubernetes Deployment

```bash
# Deploy to development environment
kubectl apply -k k8s/overlays/development/

# Verify the deployment
kubectl get all -n development
```

## 🧩 Project Structure

```
synkro/
├── frontend/
│   ├── dashboard/        # Next.js dashboard application
│   ├── auth/             # Vite-based authentication frontend
│   └── landing/          # Astro-based landing page
├── backend/
│   ├── api-gateway-auth/ # NestJS API gateway and authentication
│   ├── ai-ml-service/    # FastAPI ML prediction service
│   └── notification/     # Node.js/Bun notification service (In Progress)
├── k8s/                  # Kubernetes configuration files
├── docs/                 # Documentation files
│   ├── ARCHITECTURE.md   # Detailed system architecture
│   └── K8S.md            # Kubernetes deployment guide
└── README.md             # This file
```

## 💡 Key Components

### Frontend Layer

1. **Dashboard (Next.js)**
   - Main user interface built with React and Next.js
   - Implements Atomic Design principles
   - Uses TailwindCSS with Neobrutalism design
   - Protected routes with authentication

2. **Auth Frontend (Vite)**
   - Handles user login and registration
   - Secure token storage and management
   - Responsive design with Tailwind CSS

3. **Landing Page (Astro)**
   - Marketing and product information
   - Fast, static site generation
   - Optimized for performance and SEO

### Backend Services

1. **API Gateway & Auth (NestJS)**
   - Authentication and authorization with OAuth2/JWT
   - RBAC (Role-Based Access Control)
   - API security and rate limiting
   - Service discovery and load balancing

2. **AI/ML Service (Python/FastAPI)**
   - Demand forecasting models
   - Time series analysis
   - Stock level optimization
   - Model training and validation

3. **Notification Service (In Progress)**
   - Event-driven architecture
   - Multiple notification channels (email, push)
   - Event queue handler

### Data Layer

1. **PostgreSQL** - Primary database for orders and inventory
2. **Redis** - Caching layer and session management
3. **Elasticsearch** - Analytics and search capabilities

### Observability Stack

1. **ELK Stack** - Centralized logging and monitoring
2. **Prometheus & Grafana** - Metrics collection and visualization

## 📊 Entity Relationships

Synkro uses a well-structured database schema with relationships between:

- Users and authentication
- Inventory management
- Order processing
- ML predictions
- Customer information

For a detailed entity relationship diagram, see the [ARCHITECTURE.md](ARCHITECTURE.md) document.

## 👨‍💻 Development

### Setting Up the Development Environment

1. Install dependencies:
   ```bash
   # Frontend Dashboard
   cd frontend/dashboard
   npm install
   
   # Backend API Gateway
   cd backend/api-gateway-auth
   npm install
   ```

2. Start the services:
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d
   
   # Or start individual services
   cd frontend/dashboard
   npm run dev
   ```

3. Run tests:
   ```bash
   # Frontend tests
   cd frontend/dashboard
   npm test
   
   # Backend tests
   cd backend/api-gateway-auth
   npm test
   ```

## 🤝 Contributing

We welcome contributions to Synkro! Please see our contributing guidelines for more information.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Additional Documentation

- [Architecture Documentation](ARCHITECTURE.md) - Detailed system architecture
- [Kubernetes Guide](K8S.md) - Kubernetes deployment instructions 