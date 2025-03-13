package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/repository"
)

type inventoryRepository struct {
	db *sqlx.DB
}

func NewInventoryRepository(db *sqlx.DB) repository.InventoryRepository {
	return &inventoryRepository{db: db}
}

func (r *inventoryRepository) GetDB() *sqlx.DB {
	return r.db
}

func (r *inventoryRepository) GetInventoryLevel(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
	`
	
	var level models.InventoryLevel
	err := r.db.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
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
		return nil, fmt.Errorf("failed to get inventory level: %w", err)
	}
	
	return &level, nil
}

func (r *inventoryRepository) GetAllInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error) {
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
	`
	
	var levels []models.InventoryLevel
	err := r.db.SelectContext(ctx, &levels, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all inventory levels: %w", err)
	}
	
	return levels, nil
}

func (r *inventoryRepository) AdjustInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reason, reference string, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
		FOR UPDATE
	`
	
	var level models.InventoryLevel
	err = tx.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		if err == sql.ErrNoRows {
			if quantity < 0 {
				return nil, fmt.Errorf("cannot remove inventory from non-existent item")
			}
			
			level = models.InventoryLevel{
				ItemID:      itemID,
				WarehouseID: warehouseID,
				Quantity:    quantity,
				Reserved:    0,
				Available:   quantity,
				LastUpdated: time.Now(),
			}
			
			insertQuery := `
				INSERT INTO inventory_levels (item_id, warehouse_id, quantity, reserved, available, last_updated)
				VALUES ($1, $2, $3, $4, $5, $6)
			`
			_, err = tx.ExecContext(ctx, insertQuery, level.ItemID, level.WarehouseID, level.Quantity, level.Reserved, level.Available, level.LastUpdated)
			if err != nil {
				return nil, fmt.Errorf("failed to insert inventory level: %w", err)
			}
		} else {
			return nil, fmt.Errorf("failed to get inventory level: %w", err)
		}
	} else {
		level.Quantity += quantity
		level.Available += quantity
		level.LastUpdated = time.Now()
		
		if level.Quantity < 0 {
			return nil, fmt.Errorf("inventory quantity cannot go below zero")
		}
		
		if level.Available < 0 {
			return nil, fmt.Errorf("available inventory cannot go below zero")
		}
		
		updateQuery := `
			UPDATE inventory_levels
			SET quantity = $1, available = $2, last_updated = $3
			WHERE item_id = $4 AND warehouse_id = $5
		`
		_, err = tx.ExecContext(ctx, updateQuery, level.Quantity, level.Available, level.LastUpdated, level.ItemID, level.WarehouseID)
		if err != nil {
			return nil, fmt.Errorf("failed to update inventory level: %w", err)
		}
	}
	
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return &level, nil
}

func (r *inventoryRepository) AllocateInventory(ctx context.Context, allocation models.InventoryAllocation) (string, error) {
	// Begin a transaction
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	// Check if there's enough inventory available
	query := `
		SELECT item_id, warehouse_id, quantity, reserved, available, last_updated
		FROM inventory_levels
		WHERE item_id = $1 AND warehouse_id = $2
		FOR UPDATE
	`
	
	var level models.InventoryLevel
	err = tx.GetContext(ctx, &level, query, allocation.ItemID, allocation.WarehouseID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", models.ErrInventoryNotFound
		}
		return "", fmt.Errorf("failed to get inventory level: %w", err)
	}
	
	// Check if there's enough available
	if level.Available < allocation.Quantity {
		return "", models.ErrInsufficientInventory
	}
	
	// Update the inventory level
	level.Reserved += allocation.Quantity
	level.Available -= allocation.Quantity
	level.LastUpdated = time.Now()
	
	updateQuery := `
		UPDATE inventory_levels
		SET reserved = $1, available = $2, last_updated = $3
		WHERE item_id = $4 AND warehouse_id = $5
	`
	_, err = tx.ExecContext(ctx, updateQuery, level.Reserved, level.Available, level.LastUpdated, level.ItemID, level.WarehouseID)
	if err != nil {
		return "", fmt.Errorf("failed to update inventory level: %w", err)
	}
	
	// Get the SKU for this item
	var sku string
	skuQuery := `SELECT sku FROM inventory_items WHERE id = $1`
	err = tx.GetContext(ctx, &sku, skuQuery, allocation.ItemID)
	if err != nil {
		return "", fmt.Errorf("failed to get item SKU: %w", err)
	}
	
	// Create a reservation
	expiresAt := time.Now().Add(24 * time.Hour) // Default 24 hour expiration
	
	insertQuery := `
		INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, created_at, sku, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err = tx.ExecContext(
		ctx, 
		insertQuery, 
		uuid.New().String(), // Generate unique ID for the reservation record
		allocation.OrderID,  // This is the reservation_id referenced in other methods
		allocation.ItemID,   // Now stored as product_id
		allocation.Quantity, 
		"pending", 
		time.Now(),
		sku,
		expiresAt,
	)
	if err != nil {
		return "", fmt.Errorf("failed to create reservation: %w", err)
	}
	
	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return "", fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return allocation.OrderID, nil
}

func (r *inventoryRepository) ReleaseInventory(ctx context.Context, reservationID, reason string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	// Get all reservations for this order ID
	query := `
		SELECT r.id, r.order_id, r.product_id, r.quantity, r.status, r.created_at, r.completed_at, r.sku, r.expires_at
		FROM inventory_reservations r
		WHERE r.order_id = $1 AND r.status = 'pending'
		FOR UPDATE
	`
	
	var reservations []models.InventoryReservation
	err = tx.SelectContext(ctx, &reservations, query, reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservations: %w", err)
	}
	
	if len(reservations) == 0 {
		return fmt.Errorf("no pending reservations found for ID: %s", reservationID)
	}
	
	// Release each reservation
	for _, reservation := range reservations {
		// Update the inventory level directly
		updateQuery := `
			UPDATE inventory_levels
			SET reserved = reserved - $1, 
				available = available + $1,
				last_updated = $2
			WHERE item_id = $3
		`
		
		result, err := tx.ExecContext(
			ctx, 
			updateQuery, 
			reservation.Quantity, 
			time.Now(), 
			reservation.ProductID,
		)
		if err != nil {
			return fmt.Errorf("failed to update inventory level: %w", err)
		}
		
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected: %w", err)
		}
		
		if rowsAffected == 0 {
			// If we didn't find any inventory levels, this is odd but not fatal
			// Log this as a warning
			fmt.Printf("Warning: No inventory levels found for item %s when releasing reservation\n", reservation.ProductID)
		}
		
		// Update the reservation status
		reservationQuery := `
			UPDATE inventory_reservations
			SET status = 'released', completed_at = $1
			WHERE id = $2
		`
		_, err = tx.ExecContext(ctx, reservationQuery, time.Now(), reservation.ID)
		if err != nil {
			return fmt.Errorf("failed to update reservation: %w", err)
		}
	}
	
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return nil
}

func (r *inventoryRepository) CommitReservation(ctx context.Context, reservationID string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	// Get all reservations for this order ID
	query := `
		SELECT r.id, r.order_id, r.product_id, r.quantity, r.status, r.created_at, r.completed_at, r.sku, r.expires_at
		FROM inventory_reservations r
		WHERE r.order_id = $1 AND r.status = 'pending'
		FOR UPDATE
	`
	
	var reservations []models.InventoryReservation
	err = tx.SelectContext(ctx, &reservations, query, reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservations: %w", err)
	}
	
	if len(reservations) == 0 {
		return fmt.Errorf("no pending reservations found for ID: %s", reservationID)
	}
	
	// Commit each reservation
	for _, reservation := range reservations {
		// Update the inventory level directly - reduce quantity and reserved, leaving available unchanged
		updateQuery := `
			UPDATE inventory_levels
			SET quantity = quantity - $1, 
				reserved = reserved - $1,
				last_updated = $2
			WHERE item_id = $3
		`
		
		result, err := tx.ExecContext(
			ctx, 
			updateQuery, 
			reservation.Quantity, 
			time.Now(), 
			reservation.ProductID,
		)
		if err != nil {
			return fmt.Errorf("failed to update inventory level: %w", err)
		}
		
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected: %w", err)
		}
		
		if rowsAffected == 0 {
			// If we didn't find any inventory levels, this is odd but not fatal
			fmt.Printf("Warning: No inventory levels found for item %s when committing reservation\n", reservation.ProductID)
		}
		
		// Update the reservation status
		reservationQuery := `
			UPDATE inventory_reservations
			SET status = 'committed', completed_at = $1
			WHERE id = $2
		`
		_, err = tx.ExecContext(ctx, reservationQuery, time.Now(), reservation.ID)
		if err != nil {
			return fmt.Errorf("failed to update reservation: %w", err)
		}
	}
	
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return nil
}

func (r *inventoryRepository) CreateTransaction(ctx context.Context, transaction models.InventoryTransaction) error {
	query := `
		INSERT INTO inventory_transactions (id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.ExecContext(ctx, query, transaction.ID, transaction.ItemID, transaction.Quantity, transaction.Type, 
		transaction.Reference, transaction.WarehouseID, transaction.Timestamp, transaction.UserID)
	
	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}
	
	return nil
}

func (r *inventoryRepository) GetReservation(ctx context.Context, reservationID string) (*models.InventoryReservation, error) {
	query := `
		SELECT id, order_id, product_id, quantity, status, created_at, completed_at, sku, expires_at
		FROM inventory_reservations
		WHERE order_id = $1
	`
	
	var reservation models.InventoryReservation
	err := r.db.GetContext(ctx, &reservation, query, reservationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reservation: %w", err)
	}
	
	return &reservation, nil
}

func (r *inventoryRepository) ListInventoryLevels(ctx context.Context, filter models.InventoryFilter, extended models.InventoryFilterExtended) ([]*models.InventoryLevel, error) {
	queryBuilder := "SELECT item_id, warehouse_id, quantity, reserved, available, last_updated FROM inventory_levels WHERE 1=1"
	params := []interface{}{}
	paramCount := 1
	
	if filter.WarehouseID != "" {
		queryBuilder += fmt.Sprintf(" AND warehouse_id = $%d", paramCount)
		warehouseID, err := uuid.Parse(filter.WarehouseID)
		if err != nil {
			return nil, fmt.Errorf("invalid warehouse ID: %w", err)
		}
		params = append(params, warehouseID)
		paramCount++
	}
	
	if filter.ItemID != "" {
		queryBuilder += fmt.Sprintf(" AND item_id = $%d", paramCount)
		itemID, err := uuid.Parse(filter.ItemID)
		if err != nil {
			return nil, fmt.Errorf("invalid item ID: %w", err)
		}
		params = append(params, itemID)
		paramCount++
	}
	
	if extended.LowStockOnly {
		queryBuilder += " AND available < 10" // Use a configurable threshold in a real app
	}
	
	queryBuilder += " ORDER BY last_updated DESC"
	
	if extended.Limit > 0 {
		queryBuilder += fmt.Sprintf(" LIMIT $%d", paramCount)
		params = append(params, extended.Limit)
		paramCount++
		
		if extended.Offset > 0 {
			queryBuilder += fmt.Sprintf(" OFFSET $%d", paramCount)
			params = append(params, extended.Offset)
		}
	}
	
	var levels []*models.InventoryLevel
	err := r.db.SelectContext(ctx, &levels, queryBuilder, params...)
	if err != nil {
		return nil, fmt.Errorf("failed to list inventory levels: %w", err)
	}
	
	return levels, nil
}

func (r *inventoryRepository) BeginTx(ctx context.Context) (*sqlx.Tx, error) {
	return r.db.BeginTxx(ctx, nil)
}

func (r *inventoryRepository) CancelReservation(ctx context.Context, reservationID string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	// Get all reservations for this order ID
	query := `
		SELECT r.id, r.order_id, r.product_id, r.quantity, r.status, r.created_at, r.completed_at, r.sku, r.expires_at
		FROM inventory_reservations r
		WHERE r.order_id = $1 AND r.status = 'pending'
		FOR UPDATE
	`
	
	var reservations []models.InventoryReservation
	err = tx.SelectContext(ctx, &reservations, query, reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservations: %w", err)
	}
	
	if len(reservations) == 0 {
		return fmt.Errorf("no pending reservations found for ID: %s", reservationID)
	}
	
	// Cancel each reservation
	for _, reservation := range reservations {
		// Update the inventory level directly - reserved decreases, available increases
		updateQuery := `
			UPDATE inventory_levels
			SET reserved = reserved - $1, 
				available = available + $1,
				last_updated = $2
			WHERE item_id = $3
		`
		
		result, err := tx.ExecContext(
			ctx, 
			updateQuery, 
			reservation.Quantity, 
			time.Now(), 
			reservation.ProductID,
		)
		if err != nil {
			return fmt.Errorf("failed to update inventory level: %w", err)
		}
		
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected: %w", err)
		}
		
		if rowsAffected == 0 {
			// If we didn't find any inventory levels, this is odd but not fatal
			fmt.Printf("Warning: No inventory levels found for item %s when cancelling reservation\n", reservation.ProductID)
		}
		
		// Update the reservation status
		reservationQuery := `
			UPDATE inventory_reservations
			SET status = 'cancelled', completed_at = $1
			WHERE id = $2
		`
		_, err = tx.ExecContext(ctx, reservationQuery, time.Now(), reservation.ID)
		if err != nil {
			return fmt.Errorf("failed to update reservation: %w", err)
		}
	}
	
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return nil
}

func (r *inventoryRepository) GetInventoryReservation(ctx context.Context, reservationID string) ([]models.InventoryReservation, error) {
	query := `
		SELECT r.id, r.order_id, r.product_id, r.quantity, r.status, r.created_at, r.completed_at, r.sku, r.expires_at
		FROM inventory_reservations r
		WHERE r.order_id = $1
	`
	
	var reservations []models.InventoryReservation
	err := r.db.SelectContext(ctx, &reservations, query, reservationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reservations: %w", err)
	}
	
	if len(reservations) == 0 {
		return nil, models.ErrReservationNotFound
	}
	
	return reservations, nil
} 