package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
)

// ItemRepository defines the interface for item repository operations
type ItemRepository interface {
	CreateItem(ctx context.Context, item models.CreateItemDTO) (*models.Item, error)
	GetItem(ctx context.Context, id string) (*models.Item, error)
	GetItemBySKU(ctx context.Context, sku string) (*models.Item, error)
	UpdateItem(ctx context.Context, id string, item models.UpdateItemDTO) (*models.Item, error)
	DeleteItem(ctx context.Context, id string) error
	ListItems(ctx context.Context, filter models.ItemFilter) ([]*models.Item, error)
}

// InventoryRepository defines the interface for inventory repository operations
type InventoryRepository interface {
	GetInventoryLevel(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	AdjustInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reason, reference string, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	AllocateInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reservationID string, warehouseID uuid.UUID, userID string) error
	ReleaseInventory(ctx context.Context, reservationID string, reason string) error
	CommitReservation(ctx context.Context, reservationID string) error
	ListInventoryLevels(ctx context.Context, filter models.InventoryFilter) ([]*models.InventoryLevel, error)
	CreateTransaction(ctx context.Context, transaction models.InventoryTransaction) error
	GetReservation(ctx context.Context, reservationID string) (*models.InventoryReservation, error)
}

// WarehouseRepository defines the interface for warehouse repository operations
type WarehouseRepository interface {
	GetWarehouse(ctx context.Context, id uuid.UUID) (*models.Warehouse, error)
	ListWarehouses(ctx context.Context) ([]*models.Warehouse, error)
	CreateWarehouse(ctx context.Context, warehouse models.CreateWarehouseDTO) (*models.Warehouse, error)
	UpdateWarehouse(ctx context.Context, id uuid.UUID, warehouse models.UpdateWarehouseDTO) (*models.Warehouse, error)
	DeleteWarehouse(ctx context.Context, id uuid.UUID) error
}

type InventoryRepository interface {
	GetInventoryLevel(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	GetAllInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error)
	AddInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	RemoveInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	AllocateInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	ReleaseInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	CreateTransaction(ctx context.Context, tx *sqlx.Tx, transaction *models.InventoryTransaction) error
	GetTransactions(ctx context.Context, filters map[string]interface{}, page, pageSize int) ([]models.InventoryTransaction, int, error)
	BeginTx(ctx context.Context) (*sqlx.Tx, error)
}

type WarehouseRepository interface {
	Get(ctx context.Context, id uuid.UUID) (*models.Warehouse, error)
	GetByCode(ctx context.Context, code string) (*models.Warehouse, error)
	List(ctx context.Context) ([]models.Warehouse, error)
	Create(ctx context.Context, warehouse *models.Warehouse) error
	Update(ctx context.Context, warehouse *models.Warehouse) error
	Delete(ctx context.Context, id uuid.UUID) error
} 