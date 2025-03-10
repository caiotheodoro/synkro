package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/services"
)

type warehouseRepository struct {
	db *sqlx.DB
}

// NewWarehouseRepository creates a new warehouse repository
func NewWarehouseRepository(db *sqlx.DB) services.WarehouseRepository {
	return &warehouseRepository{
		db: db,
	}
}

// Get retrieves a warehouse by ID
func (r *warehouseRepository) Get(ctx context.Context, id uuid.UUID) (*models.Warehouse, error) {
	query := `SELECT id, code, name, address_line1, address_line2, city, state, postal_code, country, 
              contact_name, contact_phone, contact_email, active, created_at, customer_id 
              FROM warehouses WHERE id = $1`
	
	var warehouse models.Warehouse
	err := r.db.GetContext(ctx, &warehouse, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("warehouse not found: %w", err)
		}
		return nil, fmt.Errorf("error getting warehouse: %w", err)
	}
	
	return &warehouse, nil
}

// GetByCode retrieves a warehouse by code
func (r *warehouseRepository) GetByCode(ctx context.Context, code string) (*models.Warehouse, error) {
	query := `SELECT id, code, name, address_line1, address_line2, city, state, postal_code, country, 
              contact_name, contact_phone, contact_email, active, created_at, customer_id 
              FROM warehouses WHERE code = $1`
	
	var warehouse models.Warehouse
	err := r.db.GetContext(ctx, &warehouse, query, code)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("warehouse not found: %w", err)
		}
		return nil, fmt.Errorf("error getting warehouse: %w", err)
	}
	
	return &warehouse, nil
}

// List retrieves all warehouses
func (r *warehouseRepository) List(ctx context.Context) ([]models.Warehouse, error) {
	query := `SELECT id, code, name, address_line1, address_line2, city, state, postal_code, country, 
              contact_name, contact_phone, contact_email, active, created_at, customer_id 
              FROM warehouses ORDER BY name`
	
	var warehouses []models.Warehouse
	err := r.db.SelectContext(ctx, &warehouses, query)
	if err != nil {
		return nil, fmt.Errorf("error listing warehouses: %w", err)
	}
	
	return warehouses, nil
}

// Create creates a new warehouse
func (r *warehouseRepository) Create(ctx context.Context, warehouse *models.Warehouse) error {
	// Set created time if not already set
	if warehouse.CreatedAt.IsZero() {
		warehouse.CreatedAt = time.Now()
	}
	
	// Generate ID if not provided
	if warehouse.ID == uuid.Nil {
		warehouse.ID = uuid.New()
	}
	
	query := `INSERT INTO warehouses (id, code, name, address_line1, address_line2, city, state, postal_code, 
              country, contact_name, contact_phone, contact_email, active, created_at, customer_id) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
	
	_, err := r.db.ExecContext(ctx, query, 
		warehouse.ID, warehouse.Code, warehouse.Name, warehouse.AddressLine1, warehouse.AddressLine2,
		warehouse.City, warehouse.State, warehouse.PostalCode, warehouse.Country,
		warehouse.ContactName, warehouse.ContactPhone, warehouse.ContactEmail,
		warehouse.Active, warehouse.CreatedAt, warehouse.CustomerID)
	
	if err != nil {
		return fmt.Errorf("error creating warehouse: %w", err)
	}
	
	return nil
}

// Update updates an existing warehouse
func (r *warehouseRepository) Update(ctx context.Context, warehouse *models.Warehouse) error {
	query := `UPDATE warehouses 
              SET code = $1, name = $2, address_line1 = $3, address_line2 = $4, city = $5, state = $6, 
              postal_code = $7, country = $8, contact_name = $9, contact_phone = $10, contact_email = $11, 
              active = $12, customer_id = $13 
              WHERE id = $14`
	
	result, err := r.db.ExecContext(ctx, query, 
		warehouse.Code, warehouse.Name, warehouse.AddressLine1, warehouse.AddressLine2,
		warehouse.City, warehouse.State, warehouse.PostalCode, warehouse.Country,
		warehouse.ContactName, warehouse.ContactPhone, warehouse.ContactEmail,
		warehouse.Active, warehouse.CustomerID, warehouse.ID)
	
	if err != nil {
		return fmt.Errorf("error updating warehouse: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("warehouse not found")
	}
	
	return nil
}

// Delete deletes a warehouse
func (r *warehouseRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM warehouses WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("error deleting warehouse: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("warehouse not found")
	}
	
	return nil
} 