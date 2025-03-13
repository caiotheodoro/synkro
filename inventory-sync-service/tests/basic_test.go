package tests

import (
	"context"
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/stretchr/testify/assert"
	"github.com/synkro/inventory-sync-service/src/config"
	"github.com/synkro/inventory-sync-service/src/di"
	"github.com/synkro/inventory-sync-service/src/models"
)

// TestDirectInventoryAllocation tests inventory allocation without using gRPC
func TestDirectInventoryAllocation(t *testing.T) {
	// Load test environment variables
	if err := godotenv.Load("../.env.test"); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("No .env.test or .env file found. Using environment variables.")
		}
	}

	// Initialize context
	ctx := context.Background()

	// Load configuration
	cfg := config.Load()

	// Initialize DI container
	container, err := di.NewContainer(cfg)
	if err != nil {
		t.Fatalf("Failed to initialize container: %v", err)
	}
	defer container.Close()

	// Run migrations
	if err := container.DB.RunMigrations(ctx); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Create a test warehouse
	warehouseID := uuid.New()
	unique := uuid.New().String()[:8]
	warehouse := &models.Warehouse{
		ID:         warehouseID.String(),
		Code:       fmt.Sprintf("TEST-WH-%s", unique),
		Name:       fmt.Sprintf("Test Warehouse %s", unique),
		Address: models.Address{
			AddressLine1: "123 Test St",
			AddressLine2: "Unit 456",
			City:        "Test City",
			State:       "TS",
			PostalCode:  "12345",
			Country:     "US",
		},
		ContactName: "Test Contact",
		ContactPhone: "123-456-7890",
		ContactEmail: "test@example.com",
		Active:     true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	
	err = container.WarehouseRepository.CreateWarehouse(ctx, warehouse)
	if err != nil {
		t.Fatalf("Failed to create test warehouse: %v", err)
	}

	// Create a test item
	item := &models.Item{
		ID:          uuid.New().String(),
		SKU:         fmt.Sprintf("TEST-SKU-%s", unique),
		Name:        fmt.Sprintf("Test Item %s", unique),
		Description: "Integration test item",
		Category:    "Test",
		Attributes: models.JSONMap{
			"color": "blue",
			"size":  "medium",
		},
		WarehouseID: warehouseID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	err = container.ItemService.CreateItem(ctx, item)
	if err != nil {
		t.Fatalf("Failed to create test item: %v", err)
	}

	// Add inventory for the item
	itemID, _ := uuid.Parse(item.ID)
	_, err = container.InventoryService.AdjustInventory(
		ctx,
		itemID,
		100,
		"Initial test inventory",
		"TEST-REF",
		warehouseID,
	)
	if err != nil {
		t.Fatalf("Failed to add inventory: %v", err)
	}

	// Get initial inventory level
	initialLevel, err := container.InventoryService.GetInventoryLevelForItem(ctx, itemID, warehouseID)
	assert.NoError(t, err, "GetInventoryLevelForItem should not return an error")
	assert.Equal(t, int64(100), initialLevel.Available, "Initial available quantity should be 100")

	// Create a reservation ID
	reservationID := uuid.New().String()

	// Create allocation directly
	err = container.InventoryService.AllocateInventory(
		ctx,
		itemID,
		10,
		reservationID,
		warehouseID,
		"system",
	)
	assert.NoError(t, err, "AllocateInventory should not return an error")

	// Check inventory level after allocation
	updatedLevel, err := container.InventoryService.GetInventoryLevelForItem(ctx, itemID, warehouseID)
	assert.NoError(t, err, "GetInventoryLevelForItem should not return an error")
	assert.Equal(t, int64(10), updatedLevel.Reserved, "Reserved quantity should be 10")
	assert.Equal(t, int64(90), updatedLevel.Available, "Available quantity should be 90")
	
	// Get reservation
	reservation, err := container.InventoryService.GetReservation(ctx, reservationID)
	assert.NoError(t, err, "GetReservation should not return an error")
	assert.NotNil(t, reservation, "Reservation should not be nil")
	assert.Equal(t, reservationID, reservation.OrderID, "Reservation ID should match")

	// Release reservation
	err = container.InventoryService.ReleaseInventory(ctx, reservationID, "Test release")
	assert.NoError(t, err, "ReleaseInventory should not return an error")

	// Check inventory level after release
	finalLevel, err := container.InventoryService.GetInventoryLevelForItem(ctx, itemID, warehouseID)
	assert.NoError(t, err, "GetInventoryLevelForItem should not return an error")
	assert.Equal(t, int64(0), finalLevel.Reserved, "Reserved quantity should be 0")
	assert.Equal(t, int64(100), finalLevel.Available, "Available quantity should be 100")
} 