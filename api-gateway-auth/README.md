# Synkro API Gateway Auth Service

## Overview

The API Gateway Auth service is a NestJS-based backend application that serves as the central authentication and authorization service for the Synkro platform. It provides JWT-based authentication, user management, and token validation services. This gateway acts as the entry point for all authentication-related API requests from frontend services and provides secure communication with other microservices in the platform.

## Technology Stack

- **Framework**: NestJS 11
- **Runtime**: Node.js
- **HTTP Layer**: Fastify
- **Database ORM**: TypeORM
- **Database**: PostgreSQL
- **Authentication**: Passport.js, JWT
- **API Documentation**: Swagger/OpenAPI
- **Monitoring**: Prometheus, Winston
- **Security**: Helmet, CSRF protection, Rate limiting
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## Architecture

The API Gateway Auth service follows a modular architecture with the following structure:

```
api-gateway-auth/
├── src/
│   ├── main.ts                     # Application entry point
│   ├── app.module.ts               # Root application module
│   ├── data-source.ts              # TypeORM data source configuration
│   ├── modules/                    # Feature modules
│   │   ├── auth/                   # Authentication module
│   │   │   ├── auth.controller.ts  # Auth API endpoints
│   │   │   ├── auth.service.ts     # Auth business logic
│   │   │   ├── auth.module.ts      # Auth module definition
│   │   │   ├── dto/                # Data transfer objects
│   │   │   ├── guards/             # Authentication guards
│   │   │   └── strategies/         # Passport authentication strategies
│   │   └── health/                 # Health check module
│   ├── user/                       # User module
│   │   ├── user.controller.ts      # User API endpoints
│   │   ├── user.service.ts         # User business logic
│   │   ├── user.module.ts          # User module definition
│   │   ├── dto/                    # Data transfer objects
│   │   ├── entities/               # User entity definitions
│   │   └── guards/                 # User-specific guards
│   ├── common/                     # Shared components
│   │   ├── decorators/             # Custom decorators
│   │   ├── filters/                # Exception filters
│   │   ├── guards/                 # Common guards
│   │   ├── interceptors/           # HTTP interceptors
│   │   ├── middlewares/            # HTTP middlewares
│   │   └── pipes/                  # Validation pipes
│   └── migrations/                 # TypeORM migrations
├── test/                           # Test files
├── dist/                           # Compiled output
├── logs/                           # Application logs
├── .env                            # Environment variables
├── .env.example                    # Example environment variables
├── .env.development                # Development environment variables
├── .env.test                       # Test environment variables
├── Dockerfile                      # Docker configuration
├── docker-compose.yml              # Docker Compose configuration
├── k8s-deployment.yaml             # Kubernetes deployment configuration
├── nest-cli.json                   # NestJS CLI configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies and scripts
```

## Key Features

### Authentication Services

- **User Registration**: Creates new user accounts with secure password hashing
- **User Login**: Authenticates users and issues JWT tokens
- **Token Validation**: Validates JWT tokens from other services
- **Token Invalidation**: Tracks and invalidates tokens on logout
- **Profile Management**: Retrieves and updates user profile information

### Security Features

- **Password Hashing**: Bcrypt-based password hashing with salt rounds
- **JWT Management**: Token generation, validation, and expiration handling
- **CSRF Protection**: Cross-Site Request Forgery protection
- **Rate Limiting**: Prevents brute force attacks and API abuse
- **Helmet Integration**: Security headers to protect against common web vulnerabilities
- **Input Validation**: Thorough validation of all incoming request data

### User Management

- **Role-based Access Control**: User roles and permissions management
- **User CRUD Operations**: Complete user lifecycle management
- **Account Activation**: User account activation flows
- **Password Reset**: Secure password reset functionality

### Microservice Communication

- **Microservice Client**: Communication with other microservices
- **Event Publishing**: Publishes authentication events to other services
- **Health Checks**: Monitors system and dependency health

## API Endpoints

### Authentication Endpoints

- `POST /auth/login`: Authenticates a user and returns a JWT token
- `POST /auth/register`: Registers a new user
- `POST /auth/validate-token`: Validates a JWT token
- `POST /auth/logout`: Invalidates a JWT token
- `GET /auth/profile`: Returns the authenticated user's profile

### User Management Endpoints

- `GET /users`: Lists all users (admin only)
- `GET /users/:id`: Returns a specific user's information
- `PATCH /users/:id`: Updates a user's information
- `DELETE /users/:id`: Deletes a user (admin only)

### Health Check Endpoints

- `GET /health`: Returns the health status of the service
- `GET /health/database`: Checks database connectivity
- `GET /health/microservices`: Checks microservice connectivity

## Database Schema

### User Entity

- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password`: String (Hashed)
- `name`: String (Optional)
- `role`: Enum (USER, ADMIN)
- `isActive`: Boolean
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Role Entity

- `id`: UUID (Primary Key)
- `name`: String
- `description`: String
- `permissions`: JSON
- `users`: Many-to-Many relation with User entity

## Authentication Flow

1. **Registration Flow**:
   - Validate registration data
   - Check if user already exists
   - Hash password
   - Create user record
   - Generate JWT token
   - Return token and user data

2. **Login Flow**:
   - Validate login credentials
   - Find user by email
   - Verify password hash
   - Generate JWT token
   - Return token and user data

3. **Token Validation Flow**:
   - Parse JWT token
   - Verify token signature
   - Check token expiration
   - Check if token is invalidated
   - Return validation result

4. **Logout Flow**:
   - Parse JWT token
   - Add token to invalidated tokens list
   - Clean up expired invalidated tokens
   - Return success confirmation

## Environment Configuration

The service uses the following environment variables:

```
# API Gateway Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5436
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=api_gateway_auth
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true
DB_LOGGING=true

# Security Configuration
SESSION_SECRET=your-secure-session-secret
SESSION_SALT=your-secure-session-salt
CSRF_SECRET=your-secure-csrf-secret

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=1h

# Microservices Configuration
NOTIFICATION_SERVICE_HOST=localhost
NOTIFICATION_SERVICE_PORT=3001
INVENTORY_SERVICE_HOST=localhost
INVENTORY_SERVICE_PORT=3002
AI_ML_SERVICE_HOST=localhost
AI_ML_SERVICE_PORT=3003

# Rate Limiter Configuration
RATE_LIMIT_POINTS=100
RATE_LIMIT_DURATION=60
RATE_LIMIT_BLOCK_DURATION=60

# Logging Configuration
LOG_LEVEL=debug
ELK_HOST=localhost
ELK_PORT=9200

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3100
```

## Development

### Prerequisites

- Node.js 18.x or higher
- pnpm 8.x or higher
- PostgreSQL 14.x or higher

### Installation

```bash
# Install dependencies
pnpm install
```

### Setting Up the Database

```bash
# Create development database
createdb api_gateway_auth

# Run migrations
pnpm migration:run
```

### Development Server

```bash
# Start development server
pnpm start:dev
```

### Building for Production

```bash
# Build for production
pnpm build
```

### Running in Production Mode

```bash
# Start production server
pnpm start:prod
```

## Database Migrations

The service uses TypeORM migrations to manage database schema changes:

```bash
# Generate a new migration
pnpm migration:generate --name=MigrationName

# Create an empty migration
pnpm migration:create --name=MigrationName

# Run migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show
```

## Testing

The service includes comprehensive testing:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch
```

## API Documentation

The API is documented using Swagger/OpenAPI, accessible at:

```
http://localhost:3000/api/docs
```

## Performance Considerations

- **Connection Pooling**: Database connection pooling for efficient resource usage
- **Caching**: Response caching for frequently requested data
- **Rate Limiting**: Prevents API abuse and improves stability
- **Efficient Token Validation**: Optimized token validation for high-frequency requests

## Logging and Monitoring

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Log Levels**: Configurable log levels based on environment
- **ELK Integration**: Optional integration with Elasticsearch, Logstash, and Kibana
- **Prometheus Metrics**: Exposed metrics for monitoring
- **Health Checks**: Comprehensive health check endpoints

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t synkro/api-gateway-auth .

# Run Docker container
docker run -p 3000:3000 --env-file .env synkro/api-gateway-auth
```

### Docker Compose

```bash
# Start services with Docker Compose
docker-compose up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes configuration
kubectl apply -f k8s-deployment.yaml
```

## Security Best Practices

- **Environment Variables**: Sensitive information stored in environment variables
- **Password Hashing**: Secure password hashing with bcrypt
- **JWT Security**: Short-lived tokens with secure signing
- **HTTPS**: Always use HTTPS in production
- **Input Validation**: All input data validated using class-validator
- **Security Headers**: Helmet middleware for secure HTTP headers
- **Rate Limiting**: Protection against brute force attacks

## Troubleshooting

Common issues and solutions:

- **Database Connection Issues**: Check database credentials and connectivity
- **Migration Errors**: Ensure migrations are applied in the correct order
- **Token Validation Failures**: Verify JWT secret and expiration settings
- **Rate Limiting Problems**: Adjust rate limit settings for your environment
- **Microservice Communication**: Check microservice host and port configurations

## Integration with Frontend Services

- **Frontend Auth**: Provides login, registration, and token validation endpoints
- **Frontend Dashboard**: Provides user profile and authentication endpoints
- **Frontend Landing**: Indirect integration through authentication service
