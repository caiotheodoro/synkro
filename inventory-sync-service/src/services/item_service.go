package services

import (
	"context"
	"fmt"
	"time"

	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/repository"
)

type ItemService interface {
	CreateItem(ctx context.Context, dto models.CreateItemDTO) (*models.Item, error)
	GetItem(ctx context.Context, id string) (*models.Item, error)
	GetItemBySKU(ctx context.Context, sku string) (*models.Item, error)
	UpdateItem(ctx context.Context, id string, dto models.UpdateItemDTO) (*models.Item, error)
	DeleteItem(ctx context.Context, id string) error
	ListItems(ctx context.Context, page, pageSize int, category string) ([]*models.Item, int, error)
	BulkCreateItems(ctx context.Context, dtos []models.CreateItemDTO) ([]*models.Item, int, []string, error)
	BulkUpdateItems(ctx context.Context, updates map[string]models.UpdateItemDTO) ([]*models.Item, int, []string, error)
}

type itemService struct {
	repo repository.ItemRepository
}

func NewItemService(repo repository.ItemRepository) ItemService {
	return &itemService{repo: repo}
}

func (s *itemService) CreateItem(ctx context.Context, dto models.CreateItemDTO) (*models.Item, error) {
	item := models.NewItem(dto.SKU, dto.Name, dto.Description, dto.Category, dto.Attributes)
	if err := s.repo.Create(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to create item: %w", err)
	}
	return item, nil
}

func (s *itemService) GetItem(ctx context.Context, id string) (*models.Item, error) {
	item, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}
	return item, nil
}

func (s *itemService) GetItemBySKU(ctx context.Context, sku string) (*models.Item, error) {
	item, err := s.repo.GetBySKU(ctx, sku)
	if err != nil {
		return nil, fmt.Errorf("failed to get item by SKU: %w", err)
	}
	return item, nil
}

func (s *itemService) UpdateItem(ctx context.Context, id string, dto models.UpdateItemDTO) (*models.Item, error) {
	item, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get item for update: %w", err)
	}

	if dto.Name != "" {
		item.Name = dto.Name
	}
	if dto.Description != "" {
		item.Description = dto.Description
	}
	if dto.Category != "" {
		item.Category = dto.Category
	}
	if dto.Attributes != nil {
		item.Attributes = dto.Attributes
	}
	item.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to update item: %w", err)
	}
	return item, nil
}

func (s *itemService) DeleteItem(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}
	return nil
}

func (s *itemService) ListItems(ctx context.Context, page, pageSize int, category string) ([]*models.Item, int, error) {
	return s.repo.List(ctx, page, pageSize, category)
}

func (s *itemService) BulkCreateItems(ctx context.Context, dtos []models.CreateItemDTO) ([]*models.Item, int, []string, error) {
	items := make([]*models.Item, len(dtos))
	for i, dto := range dtos {
		items[i] = models.NewItem(dto.SKU, dto.Name, dto.Description, dto.Category, dto.Attributes)
	}

	successCount, errors, err := s.repo.BulkCreate(ctx, items)
	if err != nil {
		return nil, 0, nil, fmt.Errorf("failed to bulk create items: %w", err)
	}

	return items, successCount, errors, nil
}

func (s *itemService) BulkUpdateItems(ctx context.Context, updates map[string]models.UpdateItemDTO) ([]*models.Item, int, []string, error) {
	items := make([]*models.Item, 0, len(updates))
	errors := make([]string, 0)

	for id, dto := range updates {
		item, err := s.repo.GetByID(ctx, id)
		if err != nil {
			errors = append(errors, fmt.Sprintf("failed to get item %s: %v", id, err))
			continue
		}

		if dto.Name != "" {
			item.Name = dto.Name
		}
		if dto.Description != "" {
			item.Description = dto.Description
		}
		if dto.Category != "" {
			item.Category = dto.Category
		}
		if dto.Attributes != nil {
			item.Attributes = dto.Attributes
		}
		item.UpdatedAt = time.Now()

		items = append(items, item)
	}

	successCount, updateErrors, err := s.repo.BulkUpdate(ctx, items)
	if err != nil {
		return nil, 0, nil, fmt.Errorf("failed to bulk update items: %w", err)
	}

	errors = append(errors, updateErrors...)
	return items, successCount, errors, nil
} 