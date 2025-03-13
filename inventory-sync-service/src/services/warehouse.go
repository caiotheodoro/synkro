package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/repository"
)

// The WarehouseService interface is defined in interfaces.go

type warehouseService struct {
	repo repository.WarehouseRepository
}

func NewWarehouseService(repo repository.WarehouseRepository) WarehouseService {
	return &warehouseService{repo: repo}
}

func (s *warehouseService) CreateWarehouse(ctx context.Context, warehouse *models.Warehouse) error {
	// Validate required fields
	if warehouse.Name == "" {
		return errors.New("warehouse name is required")
	}
	
	if warehouse.Code == "" {
		return errors.New("warehouse code is required")
	}
	
	if warehouse.Address.AddressLine1 == "" || warehouse.Address.City == "" || 
	   warehouse.Address.State == "" || warehouse.Address.PostalCode == "" || 
	   warehouse.Address.Country == "" {
		return errors.New("warehouse address is incomplete")
	}
	
	// Set defaults if not provided
	if warehouse.CreatedAt.IsZero() {
		warehouse.CreatedAt = time.Now()
	}
	
	if warehouse.UpdatedAt.IsZero() {
		warehouse.UpdatedAt = time.Now()
	}
	
	// Ensure ID is a valid UUID string
	if warehouse.ID == "" {
		id := uuid.New()
		warehouse.ID = id.String()
	}
	
	return s.repo.CreateWarehouse(ctx, warehouse)
}

func (s *warehouseService) GetWarehouse(ctx context.Context, id uuid.UUID) (*models.Warehouse, error) {
	return s.repo.GetWarehouse(ctx, id)
}

func (s *warehouseService) UpdateWarehouse(ctx context.Context, warehouse *models.Warehouse) error {
	// Check if warehouse exists
	_, err := s.repo.GetWarehouse(ctx, uuid.MustParse(warehouse.ID))
	if err != nil {
		return fmt.Errorf("warehouse not found: %w", err)
	}
	
	// Update timestamp
	warehouse.UpdatedAt = time.Now()
	
	return s.repo.UpdateWarehouse(ctx, warehouse)
}

func (s *warehouseService) DeleteWarehouse(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteWarehouse(ctx, id)
}

func (s *warehouseService) ListWarehouses(ctx context.Context) ([]*models.Warehouse, error) {
	return s.repo.ListWarehouses(ctx)
} 