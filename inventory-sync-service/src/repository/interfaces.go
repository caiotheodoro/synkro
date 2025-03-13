package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
)

// ItemRepository defines methods for accessing item data
type ItemRepository interface {
	GetDB() *sqlx.DB
	CreateItem(ctx context.Context, item *models.Item) error
	GetItem(ctx context.Context, id string) (*models.Item, error)
	GetItemBySKU(ctx context.Context, sku string) (*models.Item, error)
	UpdateItem(ctx context.Context, item *models.Item) error
	DeleteItem(ctx context.Context, id string) error
	ListItems(ctx context.Context, filter models.ItemFilter, extended models.ItemFilterExtended) ([]*models.Item, error)
	BulkCreateItems(ctx context.Context, items []*models.Item) error
	BulkUpdateItems(ctx context.Context, items []*models.Item) error
	BulkDeleteItems(ctx context.Context, ids []string) error
}

// InventoryRepository defines methods for accessing inventory data
type InventoryRepository interface {
	GetDB() *sqlx.DB
	BeginTx(ctx context.Context) (*sqlx.Tx, error)
	GetInventoryLevel(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	GetAllInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error)
	AdjustInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reason, reference string, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	AllocateInventory(ctx context.Context, allocation models.InventoryAllocation) (string, error)
	ReleaseInventory(ctx context.Context, reservationID, reason string) error
	CommitReservation(ctx context.Context, reservationID string) error
	CancelReservation(ctx context.Context, reservationID string) error
	CreateTransaction(ctx context.Context, transaction models.InventoryTransaction) error
	GetInventoryReservation(ctx context.Context, reservationID string) ([]models.InventoryReservation, error)
	ListInventoryLevels(ctx context.Context, filter models.InventoryFilter, extended models.InventoryFilterExtended) ([]*models.InventoryLevel, error)
}

// WarehouseRepository defines the interface for warehouse repository operations
type WarehouseRepository interface {
	GetWarehouse(ctx context.Context, id uuid.UUID) (*models.Warehouse, error)
	ListWarehouses(ctx context.Context) ([]*models.Warehouse, error)
	CreateWarehouse(ctx context.Context, warehouse *models.Warehouse) error
	UpdateWarehouse(ctx context.Context, warehouse *models.Warehouse) error
	DeleteWarehouse(ctx context.Context, id uuid.UUID) error
	GetDB() *sqlx.DB
} 