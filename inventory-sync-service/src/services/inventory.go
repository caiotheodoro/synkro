package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/repository"
)

// The InventoryService interface is defined in interfaces.go

type inventoryService struct {
	db *sqlx.DB
	inventoryRepo repository.InventoryRepository
	itemRepo repository.ItemRepository
	warehouseRepo repository.WarehouseRepository
}

func NewInventoryService(inventoryRepo repository.InventoryRepository, itemRepo repository.ItemRepository, warehouseRepo repository.WarehouseRepository) InventoryService {
	return &inventoryService{
		db: inventoryRepo.GetDB(),
		inventoryRepo: inventoryRepo,
		itemRepo: itemRepo,
		warehouseRepo: warehouseRepo,
	}
}

// GetInventoryLevelForItem retrieves inventory level for a specific item in a warehouse
func (s *inventoryService) GetInventoryLevelForItem(ctx context.Context, itemID, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	return s.inventoryRepo.GetInventoryLevel(ctx, itemID, warehouseID)
}

// AdjustInventory adjusts the inventory level for a specific item
func (s *inventoryService) AdjustInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reason, reference string, warehouseID uuid.UUID) (*models.InventoryLevel, error) {
	// Implementation based on whether quantity is positive (add) or negative (remove)
	if quantity > 0 {
		return s.addInventory(ctx, itemID, quantity, reason, reference, warehouseID, "system")
	} else if quantity < 0 {
		return s.removeInventory(ctx, itemID, -quantity, reason, reference, warehouseID, "system")
	}
	
	// If quantity is zero, just return the current level
	return s.GetInventoryLevelForItem(ctx, itemID, warehouseID)
}

// Internal helper method for adding inventory
func (s *inventoryService) addInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reason, reference string, warehouseID uuid.UUID, userID string) (*models.InventoryLevel, error) {
	tx, err := s.inventoryRepo.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	// First check if the item exists
	_, err = s.itemRepo.GetItem(ctx, itemID.String())
	if err != nil {
		return nil, err
	}
	
	// Then check if the warehouse exists
	_, err = s.warehouseRepo.GetWarehouse(ctx, warehouseID)
	if err != nil {
		return nil, err
	}
	
	// Create a transaction record
	txn := models.NewInventoryTransaction(
		itemID,
		quantity,
		models.TransactionTypeAdd,
		reference,
		warehouseID,
		userID,
	)
	
	err = s.inventoryRepo.CreateTransaction(ctx, *txn)
	if err != nil {
		return nil, err
	}
	
	// Update the inventory level
	level, err := s.inventoryRepo.AdjustInventory(ctx, itemID, quantity, reason, reference, warehouseID)
	if err != nil {
		return nil, err
	}
	
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	
	return level, nil
}

// Internal helper method for removing inventory
func (s *inventoryService) removeInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reason, reference string, warehouseID uuid.UUID, userID string) (*models.InventoryLevel, error) {
	tx, err := s.inventoryRepo.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	// First check if the item exists
	_, err = s.itemRepo.GetItem(ctx, itemID.String())
	if err != nil {
		return nil, err
	}
	
	// Get the current inventory level
	level, err := s.inventoryRepo.GetInventoryLevel(ctx, itemID, warehouseID)
	if err != nil {
		return nil, err
	}
	
	// Check if there's enough available inventory
	if level.Available < quantity {
		return nil, errors.New("insufficient inventory available")
	}
	
	// Create a transaction record
	txn := models.NewInventoryTransaction(
		itemID,
		quantity,
		models.TransactionTypeRemove,
		reference,
		warehouseID,
		userID,
	)
	
	err = s.inventoryRepo.CreateTransaction(ctx, *txn)
	if err != nil {
		return nil, err
	}
	
	// Update the inventory level (using negative quantity)
	level, err = s.inventoryRepo.AdjustInventory(ctx, itemID, -quantity, reason, reference, warehouseID)
	if err != nil {
		return nil, err
	}
	
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	
	return level, nil
}

// AllocateInventory reserves a specified quantity of an item
func (s *inventoryService) AllocateInventory(ctx context.Context, itemID uuid.UUID, quantity int64, reservationID string, warehouseID uuid.UUID, userID string) error {
	// Check if there's sufficient inventory
	level, err := s.GetInventoryLevelForItem(ctx, itemID, warehouseID)
	if err != nil {
		return err
	}
	
	if level.Available < quantity {
		return errors.New("insufficient inventory available for allocation")
	}
	
	// Create allocation
	allocation := models.InventoryAllocation{
		ItemID:      itemID,
		WarehouseID: warehouseID,
		OrderID:     reservationID,
		Quantity:    quantity,
	}
	
	_, err = s.inventoryRepo.AllocateInventory(ctx, allocation)
	return err
}

// ReleaseInventory releases previously reserved inventory
func (s *inventoryService) ReleaseInventory(ctx context.Context, reservationID, reason string) error {
	return s.inventoryRepo.ReleaseInventory(ctx, reservationID, reason)
}

// CommitReservation commits a reservation (finalizes the allocation)
func (s *inventoryService) CommitReservation(ctx context.Context, reservationID string) error {
	return s.inventoryRepo.CommitReservation(ctx, reservationID)
}

// CancelReservation cancels a previous inventory reservation
func (s *inventoryService) CancelReservation(ctx context.Context, reservationID string) error {
	return s.inventoryRepo.CancelReservation(ctx, reservationID)
}

// ListInventoryLevels lists inventory levels based on filter criteria
func (s *inventoryService) ListInventoryLevels(ctx context.Context, filter models.InventoryFilter, extended models.InventoryFilterExtended) ([]*models.InventoryLevel, error) {
	// Build a combined filter based on base filter and extended properties
	fullFilter := models.InventoryFilter{
		ItemID:      filter.ItemID,
		WarehouseID: filter.WarehouseID,
		Page:        filter.Page,
		PageSize:    filter.PageSize,
	}
	
	return s.inventoryRepo.ListInventoryLevels(ctx, fullFilter, extended)
}

// GetInventoryLevels returns all inventory levels (for backward compatibility)
func (s *inventoryService) GetInventoryLevels(ctx context.Context) ([]models.InventoryLevel, error) {
	// Use an empty filter to get all levels
	levels, err := s.inventoryRepo.ListInventoryLevels(ctx, models.InventoryFilter{}, models.InventoryFilterExtended{})
	if err != nil {
		return nil, err
	}
	
	// Convert pointer slice to value slice
	result := make([]models.InventoryLevel, len(levels))
	for i, level := range levels {
		result[i] = *level
	}
	
	return result, nil
}

// GetWarehouses returns all warehouses
func (s *inventoryService) GetWarehouses(ctx context.Context) ([]models.Warehouse, error) {
	warehouses, err := s.warehouseRepo.ListWarehouses(ctx)
	if err != nil {
		return nil, err
	}
	
	// Convert from []*models.Warehouse to []models.Warehouse
	result := make([]models.Warehouse, len(warehouses))
	for i, w := range warehouses {
		result[i] = *w
	}
	
	return result, nil
}

// GetInventoryTransactions returns inventory transactions based on filter
func (s *inventoryService) GetInventoryTransactions(ctx context.Context, filter map[string]interface{}, page, pageSize int) ([]models.InventoryTransaction, int, error) {
	// Implement this method in a real application
	// For now, return an empty slice
	return []models.InventoryTransaction{}, 0, nil
}

// GetInventoryReport generates a report based on filter criteria
func (s *inventoryService) GetInventoryReport(ctx context.Context, filter models.ReportFilter) (*models.InventoryReport, error) {
	// Get inventory levels
	var inventoryItems []*models.InventoryLevel
	
	if filter.WarehouseID != "" {
		warehouseID, err := uuid.Parse(filter.WarehouseID)
		if err != nil {
			return nil, err
		}
		_ = warehouseID // Used only for validation
		
		inventoryFilter := models.InventoryFilter{
			WarehouseID: filter.WarehouseID,
		}
		extended := models.InventoryFilterExtended{
			LowStockOnly: filter.LowStockOnly,
		}
		items, err := s.inventoryRepo.ListInventoryLevels(ctx, inventoryFilter, extended)
		if err != nil {
			return nil, err
		}
		inventoryItems = items
	} else {
		// Get all inventory levels
		allLevels, err := s.inventoryRepo.GetAllInventoryLevels(ctx)
		if err != nil {
			return nil, err
		}
		
		// Convert to pointer slice
		inventoryItems = make([]*models.InventoryLevel, len(allLevels))
		for i := range allLevels {
			inventoryItems[i] = &allLevels[i]
		}
	}
	
	// Filter by category if specified
	if filter.Category != "" {
		filteredItems := make([]*models.InventoryLevel, 0)
		for _, item := range inventoryItems {
			// Get item details
			itemDetails, err := s.itemRepo.GetItem(ctx, item.ItemID.String())
			if err != nil {
				continue // Skip if we can't get the item
			}
			
			if itemDetails.Category == filter.Category {
				filteredItems = append(filteredItems, item)
			}
		}
		inventoryItems = filteredItems
	}
	
	// Build report items
	reportItems := make([]models.InventoryReportItem, 0, len(inventoryItems))
	var totalQuantity, totalReserved, totalAvailable int64
	var lowStockCount, outOfStockCount int
	
	for _, inv := range inventoryItems {
		// Get item details
		item, err := s.itemRepo.GetItem(ctx, inv.ItemID.String())
		if err != nil {
			continue // Skip if we can't get the item
		}
		
		// Determine if this is low stock (for now, simple threshold of 10)
		isLowStock := inv.Available < 10
		isOutOfStock := inv.Available == 0
		
		if isLowStock {
			lowStockCount++
		}
		
		if isOutOfStock {
			outOfStockCount++
		}
		
		// Only include low stock items if that filter is enabled
		if filter.LowStockOnly && !isLowStock {
			continue
		}
		
		reportItem := models.InventoryReportItem{
			ItemID:      inv.ItemID,
			SKU:         item.SKU,
			Name:        item.Name,
			Category:    item.Category,
			Quantity:    inv.Quantity,
			Reserved:    inv.Reserved,
			Available:   inv.Available,
			IsLowStock:  isLowStock,
			LastUpdated: inv.LastUpdated,
		}
		
		reportItems = append(reportItems, reportItem)
		
		// Update totals
		totalQuantity += inv.Quantity
		totalReserved += inv.Reserved
		totalAvailable += inv.Available
	}
	
	// Create summary
	summary := models.InventoryReportSummary{
		TotalItems:      len(reportItems),
		TotalQuantity:   totalQuantity,
		TotalReserved:   totalReserved,
		TotalAvailable:  totalAvailable,
		LowStockItems:   lowStockCount,
		OutOfStockItems: outOfStockCount,
	}
	
	// Create the report
	var warehouseIDPointer *uuid.UUID
	if filter.WarehouseID != "" {
		parsed, _ := uuid.Parse(filter.WarehouseID)
		warehouseIDPointer = &parsed
	}
	
	report := &models.InventoryReport{
		GeneratedAt: time.Now(),
		WarehouseID: warehouseIDPointer,
		Category:    filter.Category,
		FromDate:    filter.FromDate,
		ToDate:      filter.ToDate,
		Items:       reportItems,
		Summary:     summary,
	}
	
	return report, nil
}

// CheckAndReserveStock checks if items are available and reserves them
func (s *inventoryService) CheckAndReserveStock(ctx context.Context, orderID string, items []models.ProductItem, warehouseID uuid.UUID) (*models.StockReservationResult, error) {
	// Create a unique reservation ID
	reservationID := uuid.New().String()
	
	// Result variables
	availabilityList := make([]models.ProductAvailability, 0, len(items))
	success := true
	
	// Check and reserve each item
	for _, item := range items {
		var itemObj *models.Item
		var itemID uuid.UUID
		var err error
		
		// Try to get the item by ID or SKU
		if item.ProductID != "" {
			itemObj, err = s.itemRepo.GetItem(ctx, item.ProductID)
			if err != nil {
				availabilityList = append(availabilityList, models.ProductAvailability{
					ProductID:    item.ProductID,
					SKU:          item.SKU,
					InStock:      false,
					ErrorMessage: "Item not found",
				})
				success = false
				continue
			}
			itemID, _ = uuid.Parse(item.ProductID)
		} else if item.SKU != "" {
			itemObj, err = s.itemRepo.GetItemBySKU(ctx, item.SKU)
			if err != nil {
				availabilityList = append(availabilityList, models.ProductAvailability{
					SKU:          item.SKU,
					InStock:      false,
					ErrorMessage: "Item not found",
				})
				success = false
				continue
			}
			itemID, _ = uuid.Parse(itemObj.ID)
		} else {
			return nil, errors.New("either ProductID or SKU must be provided")
		}
		
		// Check inventory level
		level, err := s.GetInventoryLevelForItem(ctx, itemID, warehouseID)
		if err != nil {
			availabilityList = append(availabilityList, models.ProductAvailability{
				ProductID:         itemObj.ID,
				SKU:               itemObj.SKU,
				InStock:           false,
				AvailableQuantity: int32(level.Available),
				ErrorMessage:      "Failed to get inventory level",
			})
			success = false
			continue
		}
		
		// Check if there's enough available inventory
		if level.Available < int64(item.Quantity) {
			availabilityList = append(availabilityList, models.ProductAvailability{
				ProductID:         itemObj.ID,
				SKU:               itemObj.SKU,
				InStock:           false,
				AvailableQuantity: int32(level.Available),
				ErrorMessage:      "Insufficient stock",
			})
			success = false
			continue
		}
		
		// Reserve the inventory
		err = s.AllocateInventory(ctx, itemID, int64(item.Quantity), reservationID, warehouseID, "system")
		if err != nil {
			availabilityList = append(availabilityList, models.ProductAvailability{
				ProductID:         itemObj.ID,
				SKU:               itemObj.SKU,
				InStock:           true,
				AvailableQuantity: int32(level.Available),
				ErrorMessage:      "Failed to allocate inventory",
			})
			success = false
			continue
		}
		
		// Successfully reserved
		availabilityList = append(availabilityList, models.ProductAvailability{
			ProductID:         itemObj.ID,
			SKU:               itemObj.SKU,
			InStock:           true,
			AvailableQuantity: int32(level.Available - int64(item.Quantity)),
		})
	}
	
	// Return the response
	message := "Stock reserved successfully"
	if !success {
		message = "Some items could not be reserved"
	}
	
	return &models.StockReservationResult{
		Success:       success,
		ReservationID: reservationID,
		Items:         availabilityList,
		Message:       message,
	}, nil
}

// GetReservation retrieves a reservation by ID
func (s *inventoryService) GetReservation(ctx context.Context, reservationID string) (*models.InventoryReservation, error) {
	reservations, err := s.inventoryRepo.GetInventoryReservation(ctx, reservationID)
	if err != nil {
		return nil, err
	}
	
	if len(reservations) == 0 {
		return nil, fmt.Errorf("no reservation found with ID: %s", reservationID)
	}
	
	// Return the first reservation (there might be multiple for the same order ID)
	return &reservations[0], nil
} 