package tests

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/stretchr/testify/assert"
	pb "github.com/synkro/inventory-sync-service/src/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// This test simulates the logistics-engine calling the inventory-sync-service
// It requires the inventory-sync-service to be running
func TestEndToEndLogisticsEngineIntegration(t *testing.T) {
	if os.Getenv("SKIP_E2E_TESTS") == "true" {
		t.Skip("Skipping end-to-end tests")
	}

	// This test requires the inventory-sync-service to be running
	// on localhost:50051 (or the configured port)
	if err := godotenv.Load("../.env"); err != nil {
		t.Log("Using default GRPC port :50051 as no .env file found")
	}

	// Get gRPC port from env or use default
	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = ":50051"
	}
	target := fmt.Sprintf("localhost%s", grpcPort)

	// Connect to the running service
	conn, err := grpc.Dial(target, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("Failed to connect to gRPC server at %s: %v", target, err)
	}
	defer conn.Close()

	// Create a client
	client := pb.NewInventoryServiceClient(conn)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Step 1: Create a test item
	t.Log("Creating test item...")
	createReq := &pb.CreateItemRequest{
		Sku:         "E2E-SKU-" + uuid.New().String()[:8],
		Name:        "E2E Test Item",
		Description: "Created by E2E test",
		Category:    "Test",
		Attributes: map[string]string{
			"color": "red",
			"size":  "large",
		},
	}

	createResp, err := client.CreateItem(ctx, createReq)
	if err != nil {
		t.Fatalf("Failed to create item: %v", err)
	}
	assert.NotNil(t, createResp)
	assert.NotNil(t, createResp.Item)
	itemID := createResp.Item.Id
	t.Logf("Created item with ID: %s", itemID)

	// Generate a warehouse ID (normally this would be a real warehouse)
	warehouseID := uuid.New().String()

	// Step 2: Add inventory for the item
	t.Log("Adding inventory...")
	adjustReq := &pb.AdjustInventoryRequest{
		ItemId:     itemID,
		Quantity:   50,
		Reason:     "Initial stock for E2E testing",
		LocationId: warehouseID,
		Reference:  "E2E-REF-" + uuid.New().String()[:8],
	}

	_, err = client.AdjustInventory(ctx, adjustReq)
	if err != nil {
		t.Fatalf("Failed to adjust inventory: %v", err)
	}

	// Step 3: Simulate logistics engine reserving inventory for an order
	t.Log("Simulating order creation by reserving stock...")
	orderID := "E2E-ORDER-" + uuid.New().String()[:8]

	reserveReq := &pb.StockReservationRequest{
		OrderId:     orderID,
		WarehouseId: warehouseID,
		Items: []*pb.ProductItem{
			{
				ProductId: itemID,
				Sku:       createResp.Item.Sku,
				Quantity:  25,
			},
		},
	}

	reserveResp, err := client.CheckAndReserveStock(ctx, reserveReq)
	if err != nil {
		t.Fatalf("Failed to reserve stock: %v", err)
	}
	assert.True(t, reserveResp.Success)
	reservationID := reserveResp.ReservationId
	t.Logf("Created reservation with ID: %s", reservationID)

	// Step 4: Check inventory level after reservation
	t.Log("Checking inventory levels after reservation...")
	levelsReq := &pb.GetInventoryLevelsRequest{
		ProductIds:  []string{itemID},
		WarehouseId: warehouseID,
	}

	levelsResp, err := client.GetInventoryLevels(ctx, levelsReq)
	if err != nil {
		t.Fatalf("Failed to get inventory levels: %v", err)
	}

	// Find our item's inventory
	var itemLevel *pb.InventoryLevel
	for _, level := range levelsResp.Levels {
		if level.ItemId == itemID {
			itemLevel = level
			break
		}
	}

	assert.NotNil(t, itemLevel, "Item inventory level should be found")
	if itemLevel != nil {
		assert.Equal(t, int64(50), itemLevel.Quantity, "Total quantity should be 50")
		assert.Equal(t, int64(25), itemLevel.Reserved, "Reserved quantity should be 25")
		assert.Equal(t, int64(25), itemLevel.Available, "Available quantity should be 25")
	}

	// Step 5: Simulate logistics engine finalizing the order by committing the reservation
	t.Log("Simulating order shipment by committing reservation...")
	commitReq := &pb.CommitReservationRequest{
		ReservationId: reservationID,
		OrderId:       orderID,
	}

	commitResp, err := client.CommitReservation(ctx, commitReq)
	if err != nil {
		t.Fatalf("Failed to commit reservation: %v", err)
	}
	assert.True(t, commitResp.Success)

	// Step 6: Check inventory level after commit
	t.Log("Checking inventory levels after commit...")
	finalLevelsResp, err := client.GetInventoryLevels(ctx, levelsReq)
	if err != nil {
		t.Fatalf("Failed to get final inventory levels: %v", err)
	}

	// Find our item's inventory again
	itemLevel = nil
	for _, level := range finalLevelsResp.Levels {
		if level.ItemId == itemID {
			itemLevel = level
			break
		}
	}

	assert.NotNil(t, itemLevel, "Item inventory level should be found")
	if itemLevel != nil {
		assert.Equal(t, int64(25), itemLevel.Quantity, "Total quantity should be 25")
		assert.Equal(t, int64(0), itemLevel.Reserved, "Reserved quantity should be 0")
		assert.Equal(t, int64(25), itemLevel.Available, "Available quantity should be 25")
	}

	// Step 7: Clean up - Try to delete the test item
	t.Log("Cleaning up test data...")
	_, err = client.DeleteItem(ctx, &pb.DeleteItemRequest{Id: itemID})
	if err != nil {
		t.Logf("Warning - couldn't delete test item: %v", err)
	}

	t.Log("End-to-end test completed successfully!")
} 