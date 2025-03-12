# Testing the gRPC Communication Between Logistics Engine and Inventory Sync Service

## Confirmation of gRPC Communication

The Logistics Engine (Rust) and Inventory Sync Service (Go) communicate with each other using gRPC. Specifically:

1. The Logistics Engine acts as a gRPC client, making requests to the Inventory Sync Service
2. The Inventory Sync Service acts as a gRPC server, handling requests from the Logistics Engine
3. Key operations include checking and reserving stock, committing reservations, and releasing reserved stock

## Testing Methods

### 1. Direct gRPC Testing with grpcurl

Now that you have enabled gRPC reflection in the Inventory Sync Service, you can use `grpcurl` to directly test the gRPC endpoints:

```bash
# 1. List all available gRPC services
grpcurl -plaintext localhost:50052 list

# 2. List all methods in the InventoryService
grpcurl -plaintext localhost:50052 list inventory.InventoryService

# 3. Test the CheckAndReserveStock method
grpcurl -plaintext -d '{
  "order_id": "test-order-123",
  "items": [
    {
      "product_id": "60ab822a-8348-42db-babb-1b58e7659dd8",
      "quantity": 1
    }
  ],
  "warehouse_id": "default-warehouse"
}' localhost:50052 inventory.InventoryService/CheckAndReserveStock

# 4. Test the GetInventoryLevels method
grpcurl -plaintext -d '{}' localhost:50052 inventory.InventoryService/GetInventoryLevels
```

### 2. Integration Testing with Logistics Engine

To test the full communication between both services:

1. Start both services in their respective configurations
2. Create an order via the Logistics Engine's API
3. Verify that inventory has been reserved in the Inventory Sync Service

```bash
# 1. Start the Inventory Sync Service (if not already running)
cd inventory-sync-service && go run ./src/main.go

# 2. Start the Logistics Engine in a separate terminal
cd logistics-engine && cargo run

# 3. Create an order via the Logistics Engine API
curl -X POST http://localhost:5050/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "e7e34e5c-8c4e-4c3e-8e8a-3c3e8e8a3c3e",
    "items": [
      {
        "product_id": "60ab822a-8348-42db-babb-1b58e7659dd8",
        "sku": "TECH-001",
        "quantity": 1,
        "unit_price": 1000,
        "total_price": 1000
      }
    ]
  }'

# 4. Check the inventory levels to verify reservation
grpcurl -plaintext -d '{
  "item_ids": ["60ab822a-8348-42db-babb-1b58e7659dd8"]
}' localhost:50052 inventory.InventoryService/GetInventoryLevels
```

### 3. Creating a Go Client for Testing

You can create a simple Go program to test the Inventory Sync Service gRPC endpoints directly:

```go
package main

import (
    "context"
    "log"
    "time"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    pb "github.com/synkro/inventory-sync-service/src/proto"
)

func main() {
    // Set up connection to the gRPC server
    conn, err := grpc.Dial("localhost:50052", grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer conn.Close()
    
    // Create a client
    client := pb.NewInventoryServiceClient(conn)
    
    // Set a timeout
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    // Test CheckAndReserveStock
    resp, err := client.CheckAndReserveStock(ctx, &pb.StockReservationRequest{
        OrderId: "test-order-123",
        Items: []*pb.ProductItem{
            {
                ProductId: "60ab822a-8348-42db-babb-1b58e7659dd8",
                Quantity: 1,
            },
        },
        WarehouseId: "default-warehouse",
    })
    
    if err != nil {
        log.Fatalf("Error: %v", err)
    }
    
    log.Printf("Response: %+v", resp)
}
```

### 4. Analyzing Logs

You can check the logs of both services to verify the gRPC communication:

1. In the Logistics Engine logs, look for:
   - Requests to the Inventory Service
   - Successful or failed responses

2. In the Inventory Sync Service logs, look for:
   - Incoming gRPC requests
   - Processing steps
   - Responses sent

## Common Issues and Solutions

1. **Connection Refused**: 
   - Ensure the Inventory Sync Service is running on the correct port (50052)
   - Check INVENTORY_SERVICE_URL in the Logistics Engine .env file

2. **Invalid Arguments**:
   - Check the format of IDs (should be valid UUIDs)
   - Ensure warehouse IDs exist in the system

3. **Insufficient Stock**:
   - Check current inventory levels before testing
   - Add inventory using the Inventory Sync Service API:
   ```bash
   grpcurl -plaintext -d '{
     "item_id": "60ab822a-8348-42db-babb-1b58e7659dd8",
     "quantity": 10,
     "reason": "Testing",
     "location_id": "default-warehouse"
   }' localhost:50052 inventory.InventoryService/AdjustInventory
   ```

## End-to-End Test Scenario

1. Start both services
2. Create a new item in inventory
3. Add stock for that item
4. Create an order via Logistics Engine
5. Verify stock is reserved
6. Update order status to "shipped"
7. Verify reservation is committed

This workflow tests the full inventory reservation and commitment cycle between the two services. 