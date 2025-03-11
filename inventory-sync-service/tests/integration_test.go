package tests

import (
	"context"
	"log"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/synkro/inventory-sync-service/src/proto"
)

// Simplified Warehouse struct for testing
type Warehouse struct {
	ID          string
	Code        string
	Name        string
	AddressLine1 string
	City        string
	State       string
	PostalCode  string
	Country     string
}

func TestLogisticsEngineIntegration(t *testing.T) {
	// Connect to the gRPC server
	conn, err := grpc.Dial("localhost:50052", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("Failed to connect to gRPC server: %v", err)
	}
	defer conn.Close()

	client := pb.NewInventoryServiceClient(conn)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create test warehouse
	warehouse := createTestWarehouse(t)

	// Create test item
	item, err := createTestItem(t, client, ctx)
	if err != nil {
		t.Fatalf("Failed to create test item: %v", err)
		return
	}

	// Add inventory for the test item
	err = addInventory(t, client, ctx, item.Id, warehouse.ID)
	if err != nil {
		t.Fatalf("Failed to add inventory: %v", err)
		return
	}

	// Test CheckAndReserveStock
	err = testCheckAndReserveStock(t, client, ctx, item, warehouse)
	if err != nil {
		t.Fatalf("Failed to check and reserve stock: %v", err)
		return
	}

	// Test ReleaseReservedStock
	// Note: Implementation would require the actual order ID and reservation ID
	// from the previous step

	// Test CommitReservation
	// Note: Implementation would require the actual order ID and reservation ID
	// from the previous step
}

func createTestWarehouse(t *testing.T) *Warehouse {
	// This would typically call a warehouse creation endpoint
	// For this test, we'll assume a warehouse already exists
	// and we'll return a mock warehouse
	return &Warehouse{
		ID:          uuid.New().String(),
		Code:        "WH-TEST",
		Name:        "Test Warehouse",
		AddressLine1: "123 Test St",
		City:        "Test City",
		State:       "TS",
		PostalCode:  "12345",
		Country:     "Testland",
	}
}

func createTestItem(t *testing.T, client pb.InventoryServiceClient, ctx context.Context) (*pb.Item, error) {
	// Create a test item
	createReq := &pb.CreateItemRequest{
		Sku:         "TEST-SKU-" + uuid.New().String()[:8],
		Name:        "Test Item",
		Description: "Item for integration testing",
		Category:    "Test",
		Attributes: map[string]string{
			"color": "blue",
			"size":  "medium",
		},
	}

	resp, err := client.CreateItem(ctx, createReq)
	if err != nil {
		return nil, err
	}
	
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.Item)
	
	return resp.Item, nil
}

func addInventory(t *testing.T, client pb.InventoryServiceClient, ctx context.Context, itemID string, warehouseID string) error {
	// Add inventory for the test item
	adjustReq := &pb.AdjustInventoryRequest{
		ItemId:     itemID,
		Quantity:   100,
		Reason:     "Initial stock for testing",
		LocationId: warehouseID,
		Reference:  "INIT-" + uuid.New().String()[:8],
	}

	resp, err := client.AdjustInventory(ctx, adjustReq)
	if err != nil {
		return err
	}
	
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.InventoryLevel)
	assert.Equal(t, int64(100), resp.InventoryLevel.Quantity)
	
	return nil
}

func testCheckAndReserveStock(t *testing.T, client pb.InventoryServiceClient, ctx context.Context, item *pb.Item, warehouse *Warehouse) error {
	// Test the CheckAndReserveStock method
	reserveReq := &pb.StockReservationRequest{
		OrderId:     "TEST-ORDER-" + uuid.New().String()[:8],
		WarehouseId: warehouse.ID,
		Items: []*pb.ProductItem{
			{
				ProductId: item.Id,
				Sku:       item.Sku,
				Quantity:  10,
			},
		},
	}

	resp, err := client.CheckAndReserveStock(ctx, reserveReq)
	if err != nil {
		return err
	}
	
	assert.NotNil(t, resp)
	assert.True(t, resp.Success)
	assert.NotEmpty(t, resp.ReservationId)
	assert.Len(t, resp.Items, 1)
	assert.True(t, resp.Items[0].InStock)
	
	// The reservation ID can be used in subsequent tests for release and commit operations
	log.Printf("Created reservation with ID: %s", resp.ReservationId)
	
	return nil
} 