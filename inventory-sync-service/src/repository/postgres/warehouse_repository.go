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
	"github.com/synkro/inventory-sync-service/src/repository"
)

type warehouseRepository struct {
	db *sqlx.DB
}

func NewWarehouseRepository(db *sqlx.DB) repository.WarehouseRepository {
	return &warehouseRepository{
		db: db,
	}
}

func (r *warehouseRepository) GetDB() *sqlx.DB {
	return r.db
}

func (r *warehouseRepository) GetWarehouse(ctx context.Context, id uuid.UUID) (*models.Warehouse, error) {
	query := `SELECT w.id, w.code, w.name, 
              w.address_line1, w.address_line2, w.city, w.state, w.postal_code, w.country, 
              w.contact_name, w.contact_phone, w.contact_email, w.active, w.created_at, w.updated_at
              FROM warehouses w WHERE w.id = $1`
	
	var warehouseDB struct {
		ID           string    `db:"id"`
		Code         string    `db:"code"`
		Name         string    `db:"name"`
		AddressLine1 string    `db:"address_line1"`
		AddressLine2 string    `db:"address_line2"`
		City         string    `db:"city"`
		State        string    `db:"state"`
		PostalCode   string    `db:"postal_code"`
		Country      string    `db:"country"`
		ContactName  string    `db:"contact_name"`
		ContactPhone string    `db:"contact_phone"`
		ContactEmail string    `db:"contact_email"`
		Active       bool      `db:"active"`
		CreatedAt    time.Time `db:"created_at"`
		UpdatedAt    time.Time `db:"updated_at"`
	}
	
	err := r.db.GetContext(ctx, &warehouseDB, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("warehouse not found: %w", err)
		}
		return nil, fmt.Errorf("error getting warehouse: %w", err)
	}
	
	// Convert to Warehouse model with Address struct
	warehouse := &models.Warehouse{
		ID:           warehouseDB.ID,
		Code:         warehouseDB.Code,
		Name:         warehouseDB.Name,
		Address: models.Address{
			AddressLine1: warehouseDB.AddressLine1,
			AddressLine2: warehouseDB.AddressLine2,
			City:         warehouseDB.City,
			State:        warehouseDB.State,
			PostalCode:   warehouseDB.PostalCode,
			Country:      warehouseDB.Country,
		},
		ContactName:  warehouseDB.ContactName,
		ContactPhone: warehouseDB.ContactPhone,
		ContactEmail: warehouseDB.ContactEmail,
		Active:       warehouseDB.Active,
		CreatedAt:    warehouseDB.CreatedAt,
		UpdatedAt:    warehouseDB.UpdatedAt,
	}
	
	return warehouse, nil
}

func (r *warehouseRepository) ListWarehouses(ctx context.Context) ([]*models.Warehouse, error) {
	query := `SELECT w.id, w.code, w.name, 
              w.address_line1, w.address_line2, w.city, w.state, w.postal_code, w.country, 
              w.contact_name, w.contact_phone, w.contact_email, w.active, w.created_at, w.updated_at
              FROM warehouses w ORDER BY w.name`
	
	var warehousesDB []struct {
		ID           string    `db:"id"`
		Code         string    `db:"code"`
		Name         string    `db:"name"`
		AddressLine1 string    `db:"address_line1"`
		AddressLine2 string    `db:"address_line2"`
		City         string    `db:"city"`
		State        string    `db:"state"`
		PostalCode   string    `db:"postal_code"`
		Country      string    `db:"country"`
		ContactName  string    `db:"contact_name"`
		ContactPhone string    `db:"contact_phone"`
		ContactEmail string    `db:"contact_email"`
		Active       bool      `db:"active"`
		CreatedAt    time.Time `db:"created_at"`
		UpdatedAt    time.Time `db:"updated_at"`
	}
	
	err := r.db.SelectContext(ctx, &warehousesDB, query)
	if err != nil {
		return nil, fmt.Errorf("error listing warehouses: %w", err)
	}
	
	// Convert to Warehouse model with Address struct
	warehouses := make([]*models.Warehouse, len(warehousesDB))
	for i, w := range warehousesDB {
		warehouses[i] = &models.Warehouse{
			ID:           w.ID,
			Code:         w.Code,
			Name:         w.Name,
			Address: models.Address{
				AddressLine1: w.AddressLine1,
				AddressLine2: w.AddressLine2,
				City:         w.City,
				State:        w.State,
				PostalCode:   w.PostalCode,
				Country:      w.Country,
			},
			ContactName:  w.ContactName,
			ContactPhone: w.ContactPhone,
			ContactEmail: w.ContactEmail,
			Active:       w.Active,
			CreatedAt:    w.CreatedAt,
			UpdatedAt:    w.UpdatedAt,
		}
	}
	
	return warehouses, nil
}

func (r *warehouseRepository) CreateWarehouse(ctx context.Context, warehouse *models.Warehouse) error {
	// Set default values if not provided
	now := time.Now()
	if warehouse.CreatedAt.IsZero() {
		warehouse.CreatedAt = now
	}
	
	if warehouse.UpdatedAt.IsZero() {
		warehouse.UpdatedAt = now
	}
	
	if warehouse.ID == "" {
		warehouse.ID = uuid.New().String()
	}
	
	query := `INSERT INTO warehouses (id, code, name, 
              address_line1, address_line2, city, state, postal_code, country, 
              contact_name, contact_phone, contact_email, active, created_at, updated_at) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
	
	_, err := r.db.ExecContext(ctx, query, 
		warehouse.ID, warehouse.Code, warehouse.Name,
		warehouse.Address.AddressLine1, warehouse.Address.AddressLine2,
		warehouse.Address.City, warehouse.Address.State,
		warehouse.Address.PostalCode, warehouse.Address.Country,
		warehouse.ContactName, warehouse.ContactPhone, warehouse.ContactEmail,
		warehouse.Active, warehouse.CreatedAt, warehouse.UpdatedAt)
	
	if err != nil {
		return fmt.Errorf("error creating warehouse: %w", err)
	}
	
	return nil
}

func (r *warehouseRepository) UpdateWarehouse(ctx context.Context, warehouse *models.Warehouse) error {
	warehouse.UpdatedAt = time.Now()
	
	query := `UPDATE warehouses 
              SET code = $1, name = $2, 
              address_line1 = $3, address_line2 = $4, city = $5, state = $6, postal_code = $7, country = $8, 
              contact_name = $9, contact_phone = $10, contact_email = $11, active = $12, updated_at = $13
              WHERE id = $14`
	
	result, err := r.db.ExecContext(ctx, query, 
		warehouse.Code, warehouse.Name, 
		warehouse.Address.AddressLine1, warehouse.Address.AddressLine2,
		warehouse.Address.City, warehouse.Address.State,
		warehouse.Address.PostalCode, warehouse.Address.Country,
		warehouse.ContactName, warehouse.ContactPhone, warehouse.ContactEmail,
		warehouse.Active, warehouse.UpdatedAt, warehouse.ID)
	
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
		
func (r *warehouseRepository) DeleteWarehouse(ctx context.Context, id uuid.UUID) error {
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