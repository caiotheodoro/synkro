# Logistics Engine and Inventory Sync Service Integration

This document describes how to integrate the Logistics Engine (Rust) with the Inventory Sync Service (Go) using gRPC.

## Overview

The integration allows the Logistics Engine to:
1. Check and reserve inventory for order fulfillment
2. Release reserved inventory when orders are canceled
3. Commit reservations when orders are completed
4. Query current inventory levels

## Configuration

### Inventory Sync Service

1. The Inventory Sync Service exposes a gRPC server on port 50052 (by default).
2. Make sure the `.env` file has the correct configuration:
   ```
   GRPC_PORT=:50052
   ```

### Logistics Engine

1. The Logistics Engine connects to the Inventory Sync Service as a client.
2. Make sure the `.env` file has the correct configuration:
   ```
   INVENTORY_SERVICE_URL=http://localhost:50052
   ```

## Protocol Buffer Integration

Both services use compatible Protocol Buffers definitions:

1. The Inventory Sync Service has implemented the methods required by the Logistics Engine:
   - `CheckAndReserveStock`
   - `ReleaseReservedStock`
   - `CommitReservation`
   - `GetInventoryLevels`

2. The Logistics Engine client calls these methods to manage inventory.

## Usage

Here's how to use the integration in your code:

### Logistics Engine (Rust)

```rust
use crate::grpc::inventory::client::InventoryClient;
use crate::proto::inventory::ProductItem;

async fn reserve_stock_for_order(order_id: String, warehouse_id: String) -> Result<(), Error> {
    // Initialize the inventory client
    let inventory_client = InventoryClient::new().await?;
    
    // Create the list of items to reserve
    let items = vec![
        ProductItem {
            product_id: "product-123".to_string(),
            sku: "SKU-123".to_string(),
            quantity: 5,
        },
    ];
    
    // Check and reserve stock
    let response = inventory_client
        .check_and_reserve_stock(order_id.clone(), items, warehouse_id)
        .await?;
    
    if response.success {
        // Stock has been reserved
        let reservation_id = response.reservation_id;
        // Store the reservation ID for later use
        
        // ... rest of your order processing logic
    } else {
        // Not enough stock or other error
        // Handle the failure
    }
    
    Ok(())
}
```

### Inventory Sync Service (Go)

The service handles the following operations:

1. **Check and Reserve Stock**: Verifies if items are in stock and reserves them
   - Identifies items by product_id or SKU
   - Creates a reservation record
   - Returns success or failure with detailed item availability

2. **Release Reserved Stock**: Releases previously reserved stock
   - Requires the reservation ID from a previous reservation
   - Updates inventory levels to make items available again
   - Useful for order cancellations

3. **Commit Reservation**: Marks a reservation as used
   - Finalizes the inventory allocation
   - Used when an order is completed/shipped

## Example

An example client implementation is available in `logistics-engine/examples/inventory_example.rs`.

To run the example:
1. Start the Inventory Sync Service: `cd inventory-sync-service && go run ./src/main.go`
2. In another terminal, run the example: `cd logistics-engine/examples && cargo run --bin inventory_example`

## Testing the Integration

A test script is available in `inventory-sync-service/tests/integration_test.go`.

To run the tests:
```
cd inventory-sync-service
go test ./tests
```

## Troubleshooting

Common issues:

1. **Connection refused**: Ensure the Inventory Sync Service is running and the port (50052) is correct.
2. **Method not found**: Ensure both services have matching proto definitions.
3. **Invalid warehouse/item IDs**: Use valid UUIDs or SKUs when making requests.

## Development Workflow

When making changes:

1. Update the proto files in both services to maintain compatibility
2. Regenerate the Go code: `cd inventory-sync-service/src/proto && protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative inventory.proto`
3. Rebuild the Rust code: `cd logistics-engine && cargo build`
4. Test the integration as described above 