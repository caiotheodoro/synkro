package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
)

type ItemRepository interface {
	Create(ctx context.Context, item *models.Item) error
	GetByID(ctx context.Context, id string) (*models.Item, error)
	GetBySKU(ctx context.Context, sku string) (*models.Item, error)
	Update(ctx context.Context, item *models.Item) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, page, pageSize int, category string) ([]*models.Item, int, error)
	BulkCreate(ctx context.Context, items []*models.Item) (int, []string, error)
	BulkUpdate(ctx context.Context, items []*models.Item) (int, []string, error)
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