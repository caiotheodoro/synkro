package memory

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/synkro/inventory-sync-service/src/models"
)

type InventoryRepository struct {
	mu               sync.RWMutex
	inventoryLevels  map[string]*models.InventoryLevel    // key: itemID:locationID
	transactions     map[string]*models.InventoryTransaction
	itemTransactions map[string][]*models.InventoryTransaction // key: itemID
}

func NewInventoryRepository() *InventoryRepository {
	return &InventoryRepository{
		inventoryLevels:  make(map[string]*models.InventoryLevel),
		transactions:     make(map[string]*models.InventoryTransaction),
		itemTransactions: make(map[string][]*models.InventoryTransaction),
	}
}

func inventoryKey(itemID, locationID string) string {
	return fmt.Sprintf("%s:%s", itemID, locationID)
}

func (r *InventoryRepository) GetInventoryLevel(ctx context.Context, itemID, locationID string) (*models.InventoryLevel, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	key := inventoryKey(itemID, locationID)
	level, exists := r.inventoryLevels[key]
	if !exists {
		// Return empty inventory level if not found
		return &models.InventoryLevel{
			ItemID:      itemID,
			LocationID:  locationID,
			Quantity:    0,
			Reserved:    0,
			Available:   0,
			LastUpdated: time.Now(),
		}, nil
	}
	return level, nil
}

func (r *InventoryRepository) AdjustInventory(ctx context.Context, tx *models.InventoryTransaction) (*models.InventoryLevel, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := inventoryKey(tx.ItemID, tx.LocationID)
	level, exists := r.inventoryLevels[key]
	if !exists {
		level = &models.InventoryLevel{
			ItemID:      tx.ItemID,
			LocationID:  tx.LocationID,
			Quantity:    0,
			Reserved:    0,
			Available:   0,
			LastUpdated: time.Now(),
		}
	}

	// Update inventory level
	level.Quantity += tx.Quantity
	level.Available += tx.Quantity
	level.LastUpdated = time.Now()

	// Ensure no negative inventory
	if level.Quantity < 0 {
		return nil, fmt.Errorf("insufficient inventory to remove %d units", -tx.Quantity)
	}

	// Store transaction and update inventory level
	r.transactions[tx.ID] = tx
	r.inventoryLevels[key] = level

	// Update item transaction history
	r.itemTransactions[tx.ItemID] = append(r.itemTransactions[tx.ItemID], tx)

	return level, nil
}

func (r *InventoryRepository) AllocateInventory(ctx context.Context, tx *models.InventoryTransaction) (*models.InventoryLevel, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := inventoryKey(tx.ItemID, tx.LocationID)
	level, exists := r.inventoryLevels[key]
	if !exists {
		level = &models.InventoryLevel{
			ItemID:      tx.ItemID,
			LocationID:  tx.LocationID,
			Quantity:    0,
			Reserved:    0,
			Available:   0,
			LastUpdated: time.Now(),
		}
	}

	// Check if there's enough available inventory
	if level.Available < tx.Quantity {
		return nil, fmt.Errorf("insufficient available inventory: requested %d but only %d available", tx.Quantity, level.Available)
	}

	// Update inventory level
	level.Reserved += tx.Quantity
	level.Available -= tx.Quantity
	level.LastUpdated = time.Now()

	// Store transaction and update inventory level
	r.transactions[tx.ID] = tx
	r.inventoryLevels[key] = level

	// Update item transaction history
	r.itemTransactions[tx.ItemID] = append(r.itemTransactions[tx.ItemID], tx)

	return level, nil
}

func (r *InventoryRepository) ReleaseInventory(ctx context.Context, tx *models.InventoryTransaction) (*models.InventoryLevel, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := inventoryKey(tx.ItemID, tx.LocationID)
	level, exists := r.inventoryLevels[key]
	if !exists {
		level = &models.InventoryLevel{
			ItemID:      tx.ItemID,
			LocationID:  tx.LocationID,
			Quantity:    0,
			Reserved:    0,
			Available:   0,
			LastUpdated: time.Now(),
		}
	}

	// Check if there's enough reserved inventory
	if level.Reserved < tx.Quantity {
		return nil, fmt.Errorf("insufficient reserved inventory: requested to release %d but only %d reserved", tx.Quantity, level.Reserved)
	}

	// Update inventory level
	level.Reserved -= tx.Quantity
	level.Available += tx.Quantity
	level.LastUpdated = time.Now()

	// Store transaction and update inventory level
	r.transactions[tx.ID] = tx
	r.inventoryLevels[key] = level

	// Update item transaction history
	r.itemTransactions[tx.ItemID] = append(r.itemTransactions[tx.ItemID], tx)

	return level, nil
}

func (r *InventoryRepository) ListInventoryLevels(ctx context.Context, itemIDs []string, locationIDs []string) ([]*models.InventoryLevel, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// If both filters are empty, return all inventory levels
	if len(itemIDs) == 0 && len(locationIDs) == 0 {
		var levels []*models.InventoryLevel
		for _, level := range r.inventoryLevels {
			levels = append(levels, level)
		}
		return levels, nil
	}

	// Convert itemIDs to a map for faster lookup
	itemIDMap := make(map[string]bool)
	for _, id := range itemIDs {
		itemIDMap[id] = true
	}

	// Convert locationIDs to a map for faster lookup
	locationIDMap := make(map[string]bool)
	for _, id := range locationIDs {
		locationIDMap[id] = true
	}

	var levels []*models.InventoryLevel
	for _, level := range r.inventoryLevels {
		// If itemIDs filter is non-empty, check if the item is in the filter
		if len(itemIDs) > 0 && !itemIDMap[level.ItemID] {
			continue
		}

		// If locationIDs filter is non-empty, check if the location is in the filter
		if len(locationIDs) > 0 && !locationIDMap[level.LocationID] {
			continue
		}

		levels = append(levels, level)
	}

	return levels, nil
}

func (r *InventoryRepository) CreateInventoryTransaction(ctx context.Context, tx *models.InventoryTransaction) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Store transaction
	r.transactions[tx.ID] = tx

	// Update item transaction history
	r.itemTransactions[tx.ItemID] = append(r.itemTransactions[tx.ItemID], tx)

	return nil
}

func (r *InventoryRepository) GetTransactionsByItemID(ctx context.Context, itemID string, limit int) ([]*models.InventoryTransaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	transactions, exists := r.itemTransactions[itemID]
	if !exists {
		return []*models.InventoryTransaction{}, nil
	}

	// If limit is zero or negative, return all transactions
	if limit <= 0 {
		return transactions, nil
	}

	// If limit is greater than the number of transactions, return all transactions
	if limit >= len(transactions) {
		return transactions, nil
	}

	// Return the most recent transactions
	startIndex := len(transactions) - limit
	return transactions[startIndex:], nil
} 