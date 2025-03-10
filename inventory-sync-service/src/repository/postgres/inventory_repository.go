package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/services"
)

// inventoryRepository is a PostgreSQL implementation of the InventoryRepository interface
type inventoryRepository struct {
	db *sqlx.DB
}

// NewInventoryRepository creates a new PostgreSQL InventoryRepository
func NewInventoryRepository(db *sqlx.DB) services.InventoryRepository {
	return &inventoryRepository{db: db}
}

// GetInventoryLevel retrieves inventory level for an item at a warehouse
func (r *inventoryRepository) GetInventoryLevel(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
	`
	
	var level models.InventoryLevel
	err := r.db.GetContext(ctx, &level, query, itemID, warehouseID)

	// If no record found, return empty inventory level
	if err == sql.ErrNoRows {
		return &models.InventoryLevel{
			ItemID:      itemID,
			WarehouseID: warehouseID,
			Quantity:    0,
			Reserved:    0,
			Available:   0,
			LastUpdated: time.Now(),
		}, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get inventory level: %w", err)
	}

	return &level, nil
}

// GetAllInventoryLevels retrieves all inventory levels
func (r *inventoryRepository) GetAllInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error) {
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
	`
	
	var levels []models.InventoryLevel
	err := r.db.SelectContext(ctx, &levels, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory levels: %w", err)
	}

	return levels, nil
}

// AddInventory adds inventory quantity
func (r *inventoryRepository) AddInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	// Get current inventory level
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
		FOR UPDATE
	`
	
	var level models.InventoryLevel
	err := tx.GetContext(ctx, &level, query, itemID, warehouseID)

	now := time.Now()

	// If no record, initialize a new one
	if err == sql.ErrNoRows {
		level = models.InventoryLevel{
			ItemID:      itemID,
			WarehouseID: warehouseID,
			Quantity:    0,
			Reserved:    0,
			Available:   0,
			LastUpdated: now,
		}
	} else if err != nil {
		return nil, fmt.Errorf("failed to get inventory level: %w", err)
	}

	// Update inventory level
	level.Quantity += quantity
	level.Available += quantity
	level.LastUpdated = now

	// Insert or update inventory level
	upsertQuery := `
		INSERT INTO inventory_levels (item_id, warehouse_id, quantity, reserved, available, last_updated)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (item_id, warehouse_id) DO UPDATE
		SET quantity = $3, reserved = $4, available = $5, last_updated = $6
	`
	
	_, err = tx.ExecContext(ctx, upsertQuery, 
		level.ItemID, level.WarehouseID, level.Quantity, level.Reserved, level.Available, level.LastUpdated)

	if err != nil {
		return nil, fmt.Errorf("failed to update inventory level: %w", err)
	}

	return &level, nil
}

// RemoveInventory removes inventory quantity
func (r *inventoryRepository) RemoveInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	// Get current inventory level
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
		FOR UPDATE
	`
	
	var level models.InventoryLevel
	err := tx.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory level: %w", err)
	}

	// Check if there's enough available inventory
	if level.Available < quantity {
		return nil, fmt.Errorf("insufficient available inventory: requested %d but only %d available", quantity, level.Available)
	}

	// Update inventory level
	level.Quantity -= quantity
	level.Available -= quantity
	level.LastUpdated = time.Now()

	// Update inventory level
	updateQuery := `
		UPDATE inventory_levels
		SET quantity = $3, available = $4, last_updated = $5
		WHERE item_id = $1 AND warehouse_id = $2
	`
	
	_, err = tx.ExecContext(ctx, updateQuery, 
		level.ItemID, level.WarehouseID, level.Quantity, level.Available, level.LastUpdated)

	if err != nil {
		return nil, fmt.Errorf("failed to update inventory level: %w", err)
	}

	return &level, nil
}

// AllocateInventory allocates inventory for an order
func (r *inventoryRepository) AllocateInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	// Get current inventory level
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
		FOR UPDATE
	`
	
	var level models.InventoryLevel
	err := tx.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory level: %w", err)
	}

	// Check if there's enough available inventory
	if level.Available < quantity {
		return nil, fmt.Errorf("insufficient available inventory: requested %d but only %d available", quantity, level.Available)
	}

	// Update inventory level
	level.Reserved += quantity
	level.Available -= quantity
	level.LastUpdated = time.Now()

	// Update inventory level
	updateQuery := `
		UPDATE inventory_levels
		SET reserved = $3, available = $4, last_updated = $5
		WHERE item_id = $1 AND warehouse_id = $2
	`
	
	_, err = tx.ExecContext(ctx, updateQuery, 
		level.ItemID, level.WarehouseID, level.Reserved, level.Available, level.LastUpdated)

	if err != nil {
		return nil, fmt.Errorf("failed to update inventory level: %w", err)
	}

	return &level, nil
}

// ReleaseInventory releases reserved inventory
func (r *inventoryRepository) ReleaseInventory(ctx context.Context, tx *sqlx.Tx, itemID uuid.UUID, quantity int64, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	// Get current inventory level
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
		FOR UPDATE
	`
	
	var level models.InventoryLevel
	err := tx.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory level: %w", err)
	}

	// Check if there's enough reserved inventory
	if level.Reserved < quantity {
		return nil, fmt.Errorf("insufficient reserved inventory: requested %d but only %d reserved", quantity, level.Reserved)
	}

	// Update inventory level
	level.Reserved -= quantity
	level.Available += quantity
	level.LastUpdated = time.Now()

	// Update inventory level
	updateQuery := `
		UPDATE inventory_levels
		SET reserved = $3, available = $4, last_updated = $5
		WHERE item_id = $1 AND warehouse_id = $2
	`
	
	_, err = tx.ExecContext(ctx, updateQuery, 
		level.ItemID, level.WarehouseID, level.Reserved, level.Available, level.LastUpdated)

	if err != nil {
		return nil, fmt.Errorf("failed to update inventory level: %w", err)
	}

	return &level, nil
}

// CreateTransaction creates an inventory transaction
func (r *inventoryRepository) CreateTransaction(ctx context.Context, tx *sqlx.Tx, transaction *models.InventoryTransaction) error {
	query := `
		INSERT INTO inventory_transactions (id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	
	_, err := tx.ExecContext(ctx, query, 
		transaction.ID, transaction.ItemID, transaction.Quantity, transaction.Type, 
		transaction.Reference, transaction.WarehouseID, transaction.Timestamp, transaction.UserID)

	if err != nil {
		return fmt.Errorf("failed to create inventory transaction: %w", err)
	}

	return nil
}

// GetTransactions retrieves inventory transactions with filtering and pagination
func (r *inventoryRepository) GetTransactions(ctx context.Context, filters map[string]interface{}, page, pageSize int) ([]models.InventoryTransaction, int, error) {
	// Build query with filters
	baseQuery := `SELECT id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id 
                 FROM inventory_transactions WHERE 1=1`
	
	countQuery := `SELECT COUNT(*) FROM inventory_transactions WHERE 1=1`
	
	queryParams := []interface{}{}
	paramCounter := 1
	
	// Add filters if provided
	if filters != nil {
		for key, value := range filters {
			if key == "item_id" || key == "warehouse_id" || key == "type" || key == "reference" || key == "user_id" {
				filterClause := fmt.Sprintf(" AND %s = $%d", key, paramCounter)
				baseQuery += filterClause
				countQuery += filterClause
				queryParams = append(queryParams, value)
				paramCounter++
			}
		}
	}
	
	// Add order by and pagination
	baseQuery += fmt.Sprintf(" ORDER BY timestamp DESC LIMIT $%d OFFSET $%d", paramCounter, paramCounter+1)
	
	// Calculate offset based on page and pageSize
	offset := (page - 1) * pageSize
	queryParams = append(queryParams, pageSize, offset)
	
	// Execute count query
	var total int
	err := r.db.GetContext(ctx, &total, countQuery, queryParams[:paramCounter-1]...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count transactions: %w", err)
	}
	
	// Execute main query
	var transactions []models.InventoryTransaction
	err = r.db.SelectContext(ctx, &transactions, baseQuery, queryParams...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get transactions: %w", err)
	}
	
	return transactions, total, nil
}

// BeginTx begins a new transaction
func (r *inventoryRepository) BeginTx(ctx context.Context) (*sqlx.Tx, error) {
	return r.db.BeginTxx(ctx, nil)
}

// GetDB returns the underlying database connection
func (r *inventoryRepository) GetDB() *sqlx.DB {
	return r.db
} 