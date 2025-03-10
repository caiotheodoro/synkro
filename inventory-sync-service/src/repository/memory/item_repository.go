package memory

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"

	"github.com/synkro/inventory-sync-service/src/models"
)

type ItemRepository struct {
	mu    sync.RWMutex
	items map[string]*models.Item
	skus  map[string]string // maps SKU to ID
}

func NewItemRepository() *ItemRepository {
	return &ItemRepository{
		items: make(map[string]*models.Item),
		skus:  make(map[string]string),
	}
}

func (r *ItemRepository) Create(ctx context.Context, item *models.Item) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.items[item.ID]; exists {
		return fmt.Errorf("item with id %s already exists", item.ID)
	}

	if id, exists := r.skus[item.SKU]; exists {
		return fmt.Errorf("item with SKU %s already exists with id %s", item.SKU, id)
	}

	r.items[item.ID] = item
	r.skus[item.SKU] = item.ID
	return nil
}

func (r *ItemRepository) GetByID(ctx context.Context, id string) (*models.Item, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	item, exists := r.items[id]
	if !exists {
		return nil, fmt.Errorf("item with id %s not found", id)
	}
	return item, nil
}

func (r *ItemRepository) GetBySKU(ctx context.Context, sku string) (*models.Item, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	id, exists := r.skus[sku]
	if !exists {
		return nil, fmt.Errorf("item with SKU %s not found", sku)
	}
	return r.items[id], nil
}

func (r *ItemRepository) Update(ctx context.Context, item *models.Item) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	existingItem, exists := r.items[item.ID]
	if !exists {
		return fmt.Errorf("item with id %s not found", item.ID)
	}

	// If SKU changed, update the SKU map
	if existingItem.SKU != item.SKU {
		if id, exists := r.skus[item.SKU]; exists && id != item.ID {
			return fmt.Errorf("item with SKU %s already exists with id %s", item.SKU, id)
		}
		delete(r.skus, existingItem.SKU)
		r.skus[item.SKU] = item.ID
	}

	r.items[item.ID] = item
	return nil
}

func (r *ItemRepository) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	item, exists := r.items[id]
	if !exists {
		return fmt.Errorf("item with id %s not found", id)
	}

	delete(r.skus, item.SKU)
	delete(r.items, id)
	return nil
}

func (r *ItemRepository) List(ctx context.Context, page, pageSize int, category string) ([]*models.Item, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	var filteredItems []*models.Item
	for _, item := range r.items {
		if category == "" || strings.EqualFold(item.Category, category) {
			filteredItems = append(filteredItems, item)
		}
	}

	// Sort by name for consistent results
	sort.Slice(filteredItems, func(i, j int) bool {
		return filteredItems[i].Name < filteredItems[j].Name
	})

	total := len(filteredItems)

	// Calculate pagination
	start := (page - 1) * pageSize
	end := start + pageSize
	if start >= total {
		return []*models.Item{}, total, nil
	}
	if end > total {
		end = total
	}

	return filteredItems[start:end], total, nil
}

func (r *ItemRepository) BulkCreate(ctx context.Context, items []*models.Item) (int, []string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	successCount := 0
	errors := make([]string, 0)

	for _, item := range items {
		if _, exists := r.items[item.ID]; exists {
			errors = append(errors, fmt.Sprintf("item with id %s already exists", item.ID))
			continue
		}

		if id, exists := r.skus[item.SKU]; exists {
			errors = append(errors, fmt.Sprintf("item with SKU %s already exists with id %s", item.SKU, id))
			continue
		}

		r.items[item.ID] = item
		r.skus[item.SKU] = item.ID
		successCount++
	}

	return successCount, errors, nil
}

func (r *ItemRepository) BulkUpdate(ctx context.Context, items []*models.Item) (int, []string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	successCount := 0
	errors := make([]string, 0)

	for _, item := range items {
		existingItem, exists := r.items[item.ID]
		if !exists {
			errors = append(errors, fmt.Sprintf("item with id %s not found", item.ID))
			continue
		}

		// If SKU changed, check for conflicts
		if existingItem.SKU != item.SKU {
			if id, exists := r.skus[item.SKU]; exists && id != item.ID {
				errors = append(errors, fmt.Sprintf("item with SKU %s already exists with id %s", item.SKU, id))
				continue
			}
			delete(r.skus, existingItem.SKU)
			r.skus[item.SKU] = item.ID
		}

		r.items[item.ID] = item
		successCount++
	}

	return successCount, errors, nil
} 