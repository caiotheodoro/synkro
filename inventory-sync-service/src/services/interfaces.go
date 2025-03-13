package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/synkro/inventory-sync-service/src/models"
)

// ItemService defines methods for managing inventory items
type ItemService interface {
	// Item management
	CreateItem(ctx context.Context, item *models.Item) error
	GetItem(ctx context.Context, id string) (*models.Item, error)
	GetItemBySKU(ctx context.Context, sku string) (*models.Item, error)
	UpdateItem(ctx context.Context, item *models.Item) error
	DeleteItem(ctx context.Context, id string) error
	ListItems(ctx context.Context, filter models.ItemFilter, extended models.ItemFilterExtended) ([]*models.Item, error)
	
	// Bulk operations
	BulkCreateItems(ctx context.Context, items []*models.Item) error
	BulkUpdateItems(ctx context.Context, updates map[string]models.UpdateItemDTO) ([]*models.Item, int, []string, error)
	BulkDeleteItems(ctx context.Context, ids []string) error
}

// InventoryService defines methods for inventory operations
type InventoryService interface {
	// Inventory management
	GetInventoryLevelForItem(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	AdjustInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reason, reference string, warehouseID uuid.UUID) (*models.InventoryLevel, error) 
	
	// Reservation operations
	AllocateInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reservationID string, warehouseID uuid.UUID, userID string) error
	ReleaseInventory(ctx context.Context, reservationID, reason string) error
	CommitReservation(ctx context.Context, reservationID string) error
	CancelReservation(ctx context.Context, reservationID string) error
	
	// Listing and reporting
	ListInventoryLevels(ctx context.Context, filter models.InventoryFilter, extended models.InventoryFilterExtended) ([]*models.InventoryLevel, error)
	GetInventoryReport(ctx context.Context, filter models.ReportFilter) (*models.InventoryReport, error)
	
	// gRPC specific implementations
	CheckAndReserveStock(ctx context.Context, orderID string, items []models.ProductItem, warehouseID uuid.UUID) (*models.StockReservationResult, error)
	GetReservation(ctx context.Context, reservationID string) (*models.InventoryReservation, error)
	GetInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error)
	GetWarehouses(ctx context.Context) ([]models.Warehouse, error)
	GetInventoryTransactions(ctx context.Context, filter map[string]interface{}, page, pageSize int) ([]models.InventoryTransaction, int, error)
}

// WarehouseService defines methods for warehouse operations
type WarehouseService interface {
	CreateWarehouse(ctx context.Context, warehouse *models.Warehouse) error
	GetWarehouse(ctx context.Context, id uuid.UUID) (*models.Warehouse, error)
	UpdateWarehouse(ctx context.Context, warehouse *models.Warehouse) error
	DeleteWarehouse(ctx context.Context, id uuid.UUID) error
	ListWarehouses(ctx context.Context) ([]*models.Warehouse, error)
} 