# Inventory Sync Service

A microservice for managing inventory operations within the Synkro ecosystem. This service provides real-time inventory data synchronization and management capabilities through both gRPC and REST APIs.

## Features

- Comprehensive inventory management
- Real-time inventory updates
- Inventory allocation and reservation
- Bulk operations support
- Inventory reporting
- Dual interface (gRPC and REST)

## Architecture

The service follows a clean architecture approach with the following components:

- **API Layer**: Handles HTTP and gRPC requests
- **Service Layer**: Contains business logic
- **Repository Layer**: Manages data access
- **Model Layer**: Defines data structures

### Dependency Injection

The service uses a dependency injection container to manage dependencies and ensure proper separation of concerns:

```
┌─────────────────┐
│ DI Container    │
└─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ API Controllers │────▶│ Service Layer   │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Repository Layer│
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Database        │
                        └─────────────────┘
```

This architecture:
- Enables easier testing through interface mocking
- Promotes separation of concerns
- Makes the code more maintainable and flexible

## Integration Testing

We've implemented comprehensive integration testing to ensure the service works correctly with the Logistics Engine:

### Unit Tests

Run unit tests with:
```
go test -v ./...
```

### Integration Tests

Integration tests verify that the gRPC communication with the Logistics Engine works correctly:

```
./scripts/run_integration_tests.sh
```

These tests ensure:
- Inventory items can be created and managed
- Stock can be reserved, released, and committed
- Inventory levels are tracked correctly
- The service responds appropriately to error conditions

### End-to-End Tests

End-to-end tests simulate the Logistics Engine calling our service:

```
# Start the service first
go run ./src/main.go

# In another terminal, run the E2E tests
go test -v ./tests/e2e_test.go
```

These tests verify the complete workflow:
1. Creating inventory items
2. Adding inventory
3. Reserving stock for an order
4. Checking inventory levels
5. Committing or releasing reservations

## API Endpoints

### REST API

```