package services

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
)

type InventoryService interface {
	GetInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error)
	GetInventoryLevelForItem(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error)
	
	AddInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reference string, warehouseID uuid.UUID, userID string) error
	RemoveInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reference string, warehouseID uuid.UUID, userID string) error
	AllocateInventory(ctx context.Context, itemID uuid.UUID, quantity int64, orderID string, warehouseID uuid.UUID, userID string) error
	ReleaseInventory(ctx context.Context, itemID uuid.UUID, quantity int64, orderID string, warehouseID uuid.UUID, userID string) error
	
	GetWarehouses(ctx context.Context) ([]models.Warehouse, error)
	GetWarehouse(ctx context.Context, warehouseID uuid.UUID) (*models.Warehouse, error)
	CreateWarehouse(ctx context.Context, warehouse *models.Warehouse) error
	UpdateWarehouse(ctx context.Context, warehouse *models.Warehouse) error
	DeleteWarehouse(ctx context.Context, warehouseID uuid.UUID) error
	
	GetInventoryTransactions(ctx context.Context, filters map[string]interface{}, page, pageSize int) ([]models.InventoryTransaction, int, error)
}

type inventoryService struct {
	db *sqlx.DB
	itemRepo ItemRepository
	warehouseRepo WarehouseRepository
}

func NewInventoryService(inventoryRepo InventoryRepository, itemRepo ItemRepository, warehouseRepo WarehouseRepository) InventoryService {
	return &inventoryService{
		db: inventoryRepo.GetDB(),
		itemRepo: itemRepo,
		warehouseRepo: warehouseRepo,
	}
}

func (s *inventoryService) GetInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error) {
	query := `SELECT item_id, warehouse_id, quantity, reserved, available, last_updated FROM inventory_levels`
	var levels []models.InventoryLevel
	err := s.db.SelectContext(ctx, &levels, query)
	if err != nil {
		return nil, err
	}
	return levels, nil
}

func (s *inventoryService) GetInventoryLevelForItem(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	query := `SELECT item_id, warehouse_id, quantity, reserved, available, last_updated 
              FROM inventory_levels 
              WHERE item_id = $1 AND warehouse_id = $2`
	
	var level models.InventoryLevel
	err := s.db.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		return nil, err
	}
	return &level, nil
}

func (s *inventoryService) AddInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reference string, warehouseID uuid.UUID, userID string) error {
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	query := `SELECT item_id, warehouse_id, quantity, reserved, available, last_updated 
              FROM inventory_levels 
              WHERE item_id = $1 AND warehouse_id = $2 
              FOR UPDATE`
	
	var level models.InventoryLevel
	err = tx.GetContext(ctx, &level, query, itemID, warehouseID)
	
	if err != nil {
		level = models.InventoryLevel{
			ItemID:      itemID,
			WarehouseID: warehouseID,
			Quantity:    quantity,
			Reserved:    0,
			Available:   quantity,
			LastUpdated: time.Now(),
		}
		
		insertQuery := `INSERT INTO inventory_levels (item_id, warehouse_id, quantity, reserved, available, last_updated) 
                       VALUES ($1, $2, $3, $4, $5, $6)`
		_, err = tx.ExecContext(ctx, insertQuery, level.ItemID, level.WarehouseID, level.Quantity, level.Reserved, level.Available, level.LastUpdated)
		if err != nil {
			return err
		}
	} else {
		level.Quantity += quantity
		level.Available += quantity
		level.LastUpdated = time.Now()
		
		updateQuery := `UPDATE inventory_levels 
                       SET quantity = $1, available = $2, last_updated = $3 
                       WHERE item_id = $4 AND warehouse_id = $5`
		_, err = tx.ExecContext(ctx, updateQuery, level.Quantity, level.Available, level.LastUpdated, level.ItemID, level.WarehouseID)
		if err != nil {
			return err
		}
	}

	transaction := models.NewInventoryTransaction(itemID, quantity, models.TransactionTypeAdd, reference, warehouseID, userID)
	
	insertTxQuery := `INSERT INTO inventory_transactions (id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err = tx.ExecContext(ctx, insertTxQuery, transaction.ID, transaction.ItemID, transaction.Quantity, transaction.Type, 
					transaction.Reference, transaction.WarehouseID, transaction.Timestamp, transaction.UserID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *inventoryService) RemoveInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reference string, warehouseID uuid.UUID, userID string) error {
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	query := `SELECT item_id, warehouse_id, quantity, reserved, available, last_updated 
              FROM inventory_levels 
              WHERE item_id = $1 AND warehouse_id = $2 
              FOR UPDATE`
	
	var level models.InventoryLevel
	err = tx.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		return err
	}

	if level.Available < quantity {
		return errors.New("insufficient available inventory")
	}

	level.Quantity -= quantity
	level.Available -= quantity
	level.LastUpdated = time.Now()
	
	updateQuery := `UPDATE inventory_levels 
                   SET quantity = $1, available = $2, last_updated = $3 
                   WHERE item_id = $4 AND warehouse_id = $5`
	_, err = tx.ExecContext(ctx, updateQuery, level.Quantity, level.Available, level.LastUpdated, level.ItemID, level.WarehouseID)
	if err != nil {
		return err
	}

	transaction := models.NewInventoryTransaction(itemID, quantity, models.TransactionTypeRemove, reference, warehouseID, userID)
	
	insertTxQuery := `INSERT INTO inventory_transactions (id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err = tx.ExecContext(ctx, insertTxQuery, transaction.ID, transaction.ItemID, transaction.Quantity, transaction.Type, 
					transaction.Reference, transaction.WarehouseID, transaction.Timestamp, transaction.UserID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *inventoryService) AllocateInventory(ctx context.Context, itemID uuid.UUID, quantity int64, orderID string, warehouseID uuid.UUID, userID string) error {
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	query := `SELECT item_id, warehouse_id, quantity, reserved, available, last_updated 
              FROM inventory_levels 
              WHERE item_id = $1 AND warehouse_id = $2 
              FOR UPDATE`
	
	var level models.InventoryLevel
	err = tx.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		return err
	}

	if level.Available < quantity {
		return errors.New("insufficient available inventory")
	}

	level.Reserved += quantity
	level.Available -= quantity
	level.LastUpdated = time.Now()
	
	updateQuery := `UPDATE inventory_levels 
                   SET reserved = $1, available = $2, last_updated = $3 
                   WHERE item_id = $4 AND warehouse_id = $5`
	_, err = tx.ExecContext(ctx, updateQuery, level.Reserved, level.Available, level.LastUpdated, level.ItemID, level.WarehouseID)
	if err != nil {
		return err
	}

	transaction := models.NewInventoryTransaction(itemID, quantity, models.TransactionTypeAllocate, orderID, warehouseID, userID)
	
	insertTxQuery := `INSERT INTO inventory_transactions (id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err = tx.ExecContext(ctx, insertTxQuery, transaction.ID, transaction.ItemID, transaction.Quantity, transaction.Type, 
					transaction.Reference, transaction.WarehouseID, transaction.Timestamp, transaction.UserID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *inventoryService) ReleaseInventory(ctx context.Context, itemID uuid.UUID, quantity int64, orderID string, warehouseID uuid.UUID, userID string) error {
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	query := `SELECT item_id, warehouse_id, quantity, reserved, available, last_updated 
              FROM inventory_levels 
              WHERE item_id = $1 AND warehouse_id = $2 
              FOR UPDATE`
	
	var level models.InventoryLevel
	err = tx.GetContext(ctx, &level, query, itemID, warehouseID)
	if err != nil {
		return err
	}

	if level.Reserved < quantity {
		return errors.New("insufficient reserved inventory")
	}

	level.Reserved -= quantity
	level.Available += quantity
	level.LastUpdated = time.Now()
	
	updateQuery := `UPDATE inventory_levels 
                   SET reserved = $1, available = $2, last_updated = $3 
                   WHERE item_id = $4 AND warehouse_id = $5`
	_, err = tx.ExecContext(ctx, updateQuery, level.Reserved, level.Available, level.LastUpdated, level.ItemID, level.WarehouseID)
	if err != nil {
		return err
	}

	transaction := models.NewInventoryTransaction(itemID, quantity, models.TransactionTypeRelease, orderID, warehouseID, userID)
	
	insertTxQuery := `INSERT INTO inventory_transactions (id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err = tx.ExecContext(ctx, insertTxQuery, transaction.ID, transaction.ItemID, transaction.Quantity, transaction.Type, 
					transaction.Reference, transaction.WarehouseID, transaction.Timestamp, transaction.UserID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *inventoryService) GetWarehouses(ctx context.Context) ([]models.Warehouse, error) {
	query := `SELECT id, code, name, address_line1, address_line2, city, state, postal_code, country, 
              contact_name, contact_phone, contact_email, active, created_at, customer_id 
              FROM warehouses`
	
	var warehouses []models.Warehouse
	err := s.db.SelectContext(ctx, &warehouses, query)
	if err != nil {
		return nil, err
	}
	return warehouses, nil
}

func (s *inventoryService) GetWarehouse(ctx context.Context, warehouseID uuid.UUID) (*models.Warehouse, error) {
	query := `SELECT id, code, name, address_line1, address_line2, city, state, postal_code, country, 
              contact_name, contact_phone, contact_email, active, created_at, customer_id 
              FROM warehouses 
              WHERE id = $1`
	
	var warehouse models.Warehouse
	err := s.db.GetContext(ctx, &warehouse, query, warehouseID)
	if err != nil {
		return nil, err
	}
	return &warehouse, nil
}

func (s *inventoryService) CreateWarehouse(ctx context.Context, warehouse *models.Warehouse) error {
	query := `INSERT INTO warehouses (id, code, name, address_line1, address_line2, city, state, postal_code, 
              country, contact_name, contact_phone, contact_email, active, created_at, customer_id) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
	
	_, err := s.db.ExecContext(ctx, query, warehouse.ID, warehouse.Code, warehouse.Name, warehouse.AddressLine1, 
						warehouse.AddressLine2, warehouse.City, warehouse.State, warehouse.PostalCode, 
						warehouse.Country, warehouse.ContactName, warehouse.ContactPhone, warehouse.ContactEmail, 
						warehouse.Active, warehouse.CreatedAt, warehouse.CustomerID)
	return err
}

func (s *inventoryService) UpdateWarehouse(ctx context.Context, warehouse *models.Warehouse) error {
	query := `UPDATE warehouses 
              SET code = $1, name = $2, address_line1 = $3, address_line2 = $4, city = $5, state = $6, 
              postal_code = $7, country = $8, contact_name = $9, contact_phone = $10, contact_email = $11, 
              active = $12, customer_id = $13 
              WHERE id = $14`
	
	_, err := s.db.ExecContext(ctx, query, warehouse.Code, warehouse.Name, warehouse.AddressLine1, warehouse.AddressLine2, 
						warehouse.City, warehouse.State, warehouse.PostalCode, warehouse.Country, 
						warehouse.ContactName, warehouse.ContactPhone, warehouse.ContactEmail, warehouse.Active, 
						warehouse.CustomerID, warehouse.ID)
	return err
}

func (s *inventoryService) DeleteWarehouse(ctx context.Context, warehouseID uuid.UUID) error {
	query := `DELETE FROM warehouses WHERE id = $1`
	_, err := s.db.ExecContext(ctx, query, warehouseID)
	return err
}

func (s *inventoryService) GetInventoryTransactions(ctx context.Context, filters map[string]interface{}, page, pageSize int) ([]models.InventoryTransaction, int, error) {
	query := `SELECT id, item_id, quantity, type, reference, warehouse_id, timestamp, user_id 
              FROM inventory_transactions WHERE 1=1`
	
	countQuery := `SELECT COUNT(*) FROM inventory_transactions WHERE 1=1`
	
	queryParams := []interface{}{}
	paramCounter := 1
	
	if filters != nil {
		for key, value := range filters {
			if key == "item_id" || key == "warehouse_id" || key == "type" || key == "reference" || key == "user_id" {
				query += " AND " + key + " = $" + string(rune('0'+paramCounter))
				countQuery += " AND " + key + " = $" + string(rune('0'+paramCounter))
				queryParams = append(queryParams, value)
				paramCounter++
			}
		}
	}
	
	query += " ORDER BY timestamp DESC LIMIT $" + string(rune('0'+paramCounter)) + " OFFSET $" + string(rune('0'+paramCounter+1))
	
	offset := (page - 1) * pageSize
	queryParams = append(queryParams, pageSize, offset)
	
	var total int
	err := s.db.GetContext(ctx, &total, countQuery, queryParams[:paramCounter-1]...)
	if err != nil {
		log.Printf("Error executing count query: %v", err)
		return nil, 0, err
	}
	
	var transactions []models.InventoryTransaction
	err = s.db.SelectContext(ctx, &transactions, query, queryParams...)
	if err != nil {
		log.Printf("Error executing transaction query: %v", err)
		return nil, 0, err
	}
	
	return transactions, total, nil
} 