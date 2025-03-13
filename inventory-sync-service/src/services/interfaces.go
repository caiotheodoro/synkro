package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
)

// ItemRepository defines the interface for item operations
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

// InventoryRepository defines the interface for inventory operations
type InventoryRepository interface {
	GetDB() *sqlx.DB
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

// WarehouseRepository defines the interface for warehouse operations
type WarehouseRepository interface {
	Get(ctx context.Context, id uuid.UUID) (*models.Warehouse, error)
	GetByCode(ctx context.Context, code string) (*models.Warehouse, error)
	List(ctx context.Context) ([]models.Warehouse, error)
	Create(ctx context.Context, warehouse *models.Warehouse) error
	Update(ctx context.Context, warehouse *models.Warehouse) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// ItemService defines methods for managing inventory items
type ItemService interface {
	// Item management
	CreateItem(ctx context.Context, dto models.CreateItemDTO) (*models.Item, error)
	GetItem(ctx context.Context, id string) (*models.Item, error)
	GetItemBySKU(ctx context.Context, sku string) (*models.Item, error)
	UpdateItem(ctx context.Context, id string, dto models.UpdateItemDTO) (*models.Item, error)
	DeleteItem(ctx context.Context, id string) error
	ListItems(ctx context.Context, filter models.ItemFilter) ([]*models.Item, error)
	
	// Bulk operations
	BulkCreateItems(ctx context.Context, items []models.CreateItemDTO) ([]models.BulkItemResult, error)
	BulkUpdateItems(ctx context.Context, items []models.BulkUpdateItem) ([]models.BulkItemResult, error)
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
	
	// Listing and reporting
	ListInventoryLevels(ctx context.Context, filter models.InventoryFilter) ([]*models.InventoryLevel, error)
	GetInventoryReport(ctx context.Context, filter models.ReportFilter) (*models.InventoryReport, error)
	
	// gRPC specific implementations
	CheckAndReserveStock(ctx context.Context, orderID string, items []models.ProductItem, warehouseID uuid.UUID) (*models.StockReservationResult, error)
	GetReservation(ctx context.Context, reservationID string) (*models.InventoryReservation, error)
} 