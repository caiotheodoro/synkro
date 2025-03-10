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

## API Endpoints

### REST API

```
GET    /health                          # Health check endpoint
GET    /api/v1/items                    # List all items
GET    /api/v1/items/:id                # Get a specific item
POST   /api/v1/items                    # Create a new item
PUT    /api/v1/items/:id                # Update an item
DELETE /api/v1/items/:id                # Delete an item
POST   /api/v1/items/bulk               # Bulk create items
PUT    /api/v1/items/bulk               # Bulk update items
POST   /api/v1/inventory/adjust         # Adjust inventory levels
POST   /api/v1/inventory/allocate       # Allocate inventory
POST   /api/v1/inventory/release        # Release allocated inventory
GET    /api/v1/reports/inventory        # Get inventory reports
```

### gRPC Service

The service also exposes a gRPC interface with the following methods:

- Item Management: CreateItem, GetItem, UpdateItem, DeleteItem, ListItems
- Inventory Operations: AdjustInventory, AllocateInventory, ReleaseInventory
- Bulk Operations: BulkCreateItems, BulkUpdateItems
- Real-time Streams: StreamInventoryUpdates
- Reporting: GetInventoryReport

## Getting Started

### Prerequisites

- Go 1.21 or higher
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/synkro/inventory-sync-service.git
   cd inventory-sync-service
   ```

2. Install dependencies:
   ```
   go mod download
   ```

3. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```

4. Run the service:
   ```
   go run ./src/main.go
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ENV | Environment (development/production) | development |
| GRPC_PORT | gRPC server port | :50051 |
| HTTP_PORT | HTTP server port | :8080 |
| JWT_SECRET | Secret for JWT authentication | default-secret-key-for-development-only |

## Development

### Building

```
go build -o inventory-sync ./src/main.go
```

### Testing

```
go test ./...
```

### Docker

Build the Docker image:

```
docker build -t inventory-sync-service .
```

Run the container:

```
docker run -p 8080:8080 -p 50051:50051 inventory-sync-service
```

## Integration with Other Services

The Inventory Sync Service integrates with:

- **Logistics Engine**: For order fulfillment and inventory allocation
- **API Gateway**: For authentication and user operations

## License

This project is licensed under the MIT License - see the LICENSE file for details. 