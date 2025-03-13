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

// The ItemService interface is defined in interfaces.go

type itemService struct {
	repo repository.ItemRepository
}

func NewItemService(repo repository.ItemRepository) ItemService {
	return &itemService{repo: repo}
}

func (s *itemService) CreateItem(ctx context.Context, item *models.Item) error {
	// Validate item
	if item.Name == "" {
		return errors.New("item name is required")
	}
	
	if item.SKU == "" {
		return errors.New("item SKU is required")
	}
	
	// Generate ID if not present
	if item.ID == "" {
		id := uuid.New()
		item.ID = id.String()
	}
	
	return s.repo.CreateItem(ctx, item)
}

func (s *itemService) GetItem(ctx context.Context, id string) (*models.Item, error) {
	return s.repo.GetItem(ctx, id)
}

func (s *itemService) GetItemBySKU(ctx context.Context, sku string) (*models.Item, error) {
	return s.repo.GetItemBySKU(ctx, sku)
}

func (s *itemService) UpdateItem(ctx context.Context, item *models.Item) error {
	// Check if item exists
	_, err := s.repo.GetItem(ctx, item.ID)
	if err != nil {
		return err
	}
	
	return s.repo.UpdateItem(ctx, item)
}

func (s *itemService) DeleteItem(ctx context.Context, id string) error {
	return s.repo.DeleteItem(ctx, id)
}

func (s *itemService) ListItems(ctx context.Context, filter models.ItemFilter, extended models.ItemFilterExtended) ([]*models.Item, error) {
	return s.repo.ListItems(ctx, filter, extended)
}

func (s *itemService) BulkCreateItems(ctx context.Context, items []*models.Item) error {
	for _, item := range items {
		if item.ID == "" {
			id := uuid.New()
			item.ID = id.String()
		}
	}
	
	return s.repo.BulkCreateItems(ctx, items)
}

func (s *itemService) BulkUpdateItems(ctx context.Context, updates map[string]models.UpdateItemDTO) ([]*models.Item, int, []string, error) {
	updatedItems := make([]*models.Item, 0)
	successCount := 0
	errorMessages := make([]string, 0)
	
	var itemIDs []string
	for id := range updates {
		itemIDs = append(itemIDs, id)
	}
	
	for id, update := range updates {
		item, err := s.repo.GetItem(ctx, id)
		if err != nil {
			errorMessages = append(errorMessages, fmt.Sprintf("Item %s not found: %v", id, err))
			continue
		}
		
		if update.Name != "" {
			item.Name = update.Name
		}
		if update.Description != "" {
			item.Description = update.Description
		}
		if update.Category != "" {
			item.Category = update.Category
		}
		if len(update.Attributes) > 0 {
			if item.Attributes == nil {
				item.Attributes = make(map[string]interface{})
			}
			for k, v := range update.Attributes {
				item.Attributes[k] = v
			}
		}
		
		item.UpdatedAt = time.Now()
		
		// Update the item
		err = s.repo.UpdateItem(ctx, item)
		if err != nil {
			errorMessages = append(errorMessages, fmt.Sprintf("Failed to update item %s: %v", id, err))
			continue
		}
		
		updatedItems = append(updatedItems, item)
		successCount++
	}
	
	return updatedItems, successCount, errorMessages, nil
}

func (s *itemService) BulkDeleteItems(ctx context.Context, ids []string) error {
	return s.repo.BulkDeleteItems(ctx, ids)
} 