package grpc

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/services"
	pb "github.com/synkro/inventory-sync-service/src/proto"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type InventoryServer struct {
	pb.UnimplementedInventoryServiceServer
	itemService      services.ItemService
	inventoryService services.InventoryService
}

func NewInventoryServer(itemService services.ItemService, inventoryService services.InventoryService) *InventoryServer {
	return &InventoryServer{
		itemService:      itemService,
		inventoryService: inventoryService,
	}
}

// CreateItem creates a new inventory item
func (s *InventoryServer) CreateItem(ctx context.Context, req *pb.CreateItemRequest) (*pb.ItemResponse, error) {
	// Convert request to DTO
	attributes := make(models.JSONMap)
	for k, v := range req.Attributes {
		attributes[k] = v
	}

	dto := models.CreateItemDTO{
		SKU:         req.Sku,
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Attributes:  attributes,
	}

	// Create item
	item, err := s.itemService.CreateItem(ctx, dto)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create item: %v", err)
	}

	// Convert item to response
	return &pb.ItemResponse{
		Item: convertItemToProto(item),
	}, nil
}

// GetItem retrieves an item by ID
func (s *InventoryServer) GetItem(ctx context.Context, req *pb.GetItemRequest) (*pb.ItemResponse, error) {
	item, err := s.itemService.GetItem(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "item not found: %v", err)
	}

	return &pb.ItemResponse{
		Item: convertItemToProto(item),
	}, nil
}

// UpdateItem updates an existing item
func (s *InventoryServer) UpdateItem(ctx context.Context, req *pb.UpdateItemRequest) (*pb.ItemResponse, error) {
	// Convert request to DTO
	attributes := make(models.JSONMap)
	for k, v := range req.Attributes {
		attributes[k] = v
	}

	dto := models.UpdateItemDTO{
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Attributes:  attributes,
	}

	// Update item
	item, err := s.itemService.UpdateItem(ctx, req.Id, dto)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update item: %v", err)
	}

	// Convert item to response
	return &pb.ItemResponse{
		Item: convertItemToProto(item),
	}, nil
}

// DeleteItem removes an item
func (s *InventoryServer) DeleteItem(ctx context.Context, req *pb.DeleteItemRequest) (*pb.DeleteItemResponse, error) {
	err := s.itemService.DeleteItem(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete item: %v", err)
	}

	return &pb.DeleteItemResponse{
		Success: true,
	}, nil
}

// ListItems retrieves a list of items
func (s *InventoryServer) ListItems(ctx context.Context, req *pb.ListItemsRequest) (*pb.ListItemsResponse, error) {
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 {
		pageSize = 10
	}

	items, total, err := s.itemService.ListItems(ctx, page, pageSize, req.Category)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list items: %v", err)
	}

	protoItems := make([]*pb.Item, len(items))
	for i, item := range items {
		protoItems[i] = convertItemToProto(item)
	}

	return &pb.ListItemsResponse{
		Items:    protoItems,
		Total:    int32(total),
		Page:     int32(page),
		PageSize: int32(pageSize),
	}, nil
}

// AdjustInventory adjusts the inventory levels
func (s *InventoryServer) AdjustInventory(ctx context.Context, req *pb.AdjustInventoryRequest) (*pb.AdjustInventoryResponse, error) {
	itemID, err := uuid.Parse(req.ItemId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid item ID: %v", err)
	}

	warehouseID, err := uuid.Parse(req.LocationId) // Using LocationId from proto for backward compatibility
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid warehouse ID: %v", err)
	}

	userID := "system" // Default to system if not provided
	if req.Reference != "" {
		userID = req.Reference // Using Reference field for userID for backward compatibility
	}

	if req.Quantity > 0 {
		err = s.inventoryService.AddInventory(ctx, itemID, req.Quantity, req.Reference, warehouseID, userID)
	} else {
		err = s.inventoryService.RemoveInventory(ctx, itemID, -req.Quantity, req.Reference, warehouseID, userID)
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to adjust inventory: %v", err)
	}

	level, err := s.inventoryService.GetInventoryLevelForItem(ctx, itemID, warehouseID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get updated inventory level: %v", err)
	}

	return &pb.AdjustInventoryResponse{
		InventoryLevel: convertInventoryLevelToProto(level),
	}, nil
}

// AllocateInventory allocates inventory for an order
func (s *InventoryServer) AllocateInventory(ctx context.Context, req *pb.AllocateInventoryRequest) (*pb.AllocateInventoryResponse, error) {
	itemID, err := uuid.Parse(req.ItemId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid item ID: %v", err)
	}

	warehouseID, err := uuid.Parse(req.LocationId) // Using LocationId from proto for backward compatibility
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid warehouse ID: %v", err)
	}

	userID := "system" // Default to system if not provided

	err = s.inventoryService.AllocateInventory(ctx, itemID, req.Quantity, req.OrderId, warehouseID, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to allocate inventory: %v", err)
	}

	level, err := s.inventoryService.GetInventoryLevelForItem(ctx, itemID, warehouseID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get updated inventory level: %v", err)
	}

	return &pb.AllocateInventoryResponse{
		Success:        true,
		InventoryLevel: convertInventoryLevelToProto(level),
	}, nil
}

// ReleaseInventory releases allocated inventory
func (s *InventoryServer) ReleaseInventory(ctx context.Context, req *pb.ReleaseInventoryRequest) (*pb.ReleaseInventoryResponse, error) {
	itemID, err := uuid.Parse(req.ItemId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid item ID: %v", err)
	}

	warehouseID, err := uuid.Parse(req.LocationId) // Using LocationId from proto for backward compatibility
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid warehouse ID: %v", err)
	}

	userID := "system" // Default to system if not provided

	err = s.inventoryService.ReleaseInventory(ctx, itemID, req.Quantity, req.OrderId, warehouseID, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to release inventory: %v", err)
	}

	level, err := s.inventoryService.GetInventoryLevelForItem(ctx, itemID, warehouseID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get updated inventory level: %v", err)
	}

	return &pb.ReleaseInventoryResponse{
		Success:        true,
		InventoryLevel: convertInventoryLevelToProto(level),
	}, nil
}

func (s *InventoryServer) BulkCreateItems(ctx context.Context, req *pb.BulkCreateItemsRequest) (*pb.BulkCreateItemsResponse, error) {
	dtos := make([]models.CreateItemDTO, len(req.Items))
	for i, item := range req.Items {
		attributes := make(models.JSONMap)
		for k, v := range item.Attributes {
			attributes[k] = v
		}

		dtos[i] = models.CreateItemDTO{
			SKU:         item.Sku,
			Name:        item.Name,
			Description: item.Description,
			Category:    item.Category,
			Attributes:  attributes,
		}
	}

	items, successCount, errors, err := s.itemService.BulkCreateItems(ctx, dtos)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to bulk create items: %v", err)
	}

	// Convert items to proto
	protoItems := make([]*pb.Item, len(items))
	for i, item := range items {
		protoItems[i] = convertItemToProto(item)
	}

	return &pb.BulkCreateItemsResponse{
		Items:        protoItems,
		SuccessCount: int32(successCount),
		FailureCount: int32(len(dtos) - successCount),
		Errors:       errors,
	}, nil
}

func (s *InventoryServer) BulkUpdateItems(ctx context.Context, req *pb.BulkUpdateItemsRequest) (*pb.BulkUpdateItemsResponse, error) {
	updates := make(map[string]models.UpdateItemDTO)
	for _, item := range req.Items {
		attributes := make(models.JSONMap)
		for k, v := range item.Attributes {
			attributes[k] = v
		}

		updates[item.Id] = models.UpdateItemDTO{
			Name:        item.Name,
			Description: item.Description,
			Category:    item.Category,
			Attributes:  attributes,
		}
	}

	items, successCount, errors, err := s.itemService.BulkUpdateItems(ctx, updates)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to bulk update items: %v", err)
	}

	protoItems := make([]*pb.Item, len(items))
	for i, item := range items {
		protoItems[i] = convertItemToProto(item)
	}

	return &pb.BulkUpdateItemsResponse{
		Items:        protoItems,
		SuccessCount: int32(successCount),
		FailureCount: int32(len(updates) - successCount),
		Errors:       errors,
	}, nil
}

func (s *InventoryServer) StreamInventoryUpdates(req *pb.StreamInventoryUpdatesRequest, stream pb.InventoryService_StreamInventoryUpdatesServer) error {
	ctx := stream.Context()

	levels, err := s.inventoryService.GetInventoryLevels(ctx)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to get inventory levels: %v", err)
	}

	for i, level := range levels {
		event := &pb.InventoryUpdateEvent{
			EventId:        fmt.Sprintf("init-%d", i),
			EventType:      "initial",
			InventoryLevel: convertInventoryLevelToProto(&level),
			Timestamp:      timestamppb.New(time.Now()),
		}

		if err := stream.Send(event); err != nil {
			return status.Errorf(codes.Internal, "failed to send event: %v", err)
		}
	}

	// In a real implementation, we would subscribe to a message queue or event stream
	// for inventory updates and forward them to the client. Here we'll just wait for
	// the client to disconnect
	<-ctx.Done()
	return nil
}

// GetInventoryReport generates an inventory report
func (s *InventoryServer) GetInventoryReport(ctx context.Context, req *pb.GetInventoryReportRequest) (*pb.InventoryReportResponse, error) {
	// In a real implementation, this would generate a proper report
	// For now we'll simulate a basic report
	
	levels, err := s.inventoryService.GetInventoryLevels(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get inventory levels: %v", err)
	}
	
	reportItems := make([]*pb.InventoryReportItem, 0)
	totalItems := 0
	totalQuantity := int32(0)
	lowStockCount := int32(0)
	
	for _, level := range levels {
		item, err := s.itemService.GetItem(ctx, level.ItemID.String())
		if err != nil {
			continue
		}
		
		// Filter by category if specified
		if req.Category != "" && item.Category != req.Category {
			continue
		}
		
		// Check low stock if threshold provided
		requiresReorder := false
		if req.Threshold > 0 && level.Quantity <= int64(req.Threshold) {
			requiresReorder = true
			lowStockCount++
		}
		
		// Skip if only low stock requested and item is not low stock
		if req.LowStockOnly && !requiresReorder {
			continue
		}
		
		totalItems++
		totalQuantity += int32(level.Quantity)
		
		reportItem := &pb.InventoryReportItem{
			Item:           convertItemToProto(item),
			InventoryLevel: convertInventoryLevelToProto(&level),
			SalesVelocity:  0, // Would be calculated in a real implementation
			DaysOnHand:     0, // Would be calculated in a real implementation
			RequiresReorder: requiresReorder,
		}
		
		reportItems = append(reportItems, reportItem)
	}
	
	return &pb.InventoryReportResponse{
		Items:         reportItems,
		TotalItems:    int32(totalItems),
		TotalQuantity: totalQuantity,
		TotalValue:    0, // Would be calculated in a real implementation
		LowStockCount: lowStockCount,
		ReportTime:    timestamppb.New(time.Now()),
	}, nil
}

// GetInventoryLevels returns all inventory levels
func (s *InventoryServer) GetInventoryLevels(ctx context.Context, req *pb.GetInventoryLevelsRequest) (*pb.GetInventoryLevelsResponse, error) {
	levels, err := s.inventoryService.GetInventoryLevels(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list inventory levels: %v", err)
	}

	protoLevels := make([]*pb.InventoryLevel, len(levels))
	for i, level := range levels {
		protoLevels[i] = convertInventoryLevelToProto(&level)
	}

	return &pb.GetInventoryLevelsResponse{
		Levels: protoLevels,
	}, nil
}

// CheckAndReserveStock checks if products are in stock and reserves them
func (s *InventoryServer) CheckAndReserveStock(ctx context.Context, req *pb.StockReservationRequest) (*pb.StockReservationResponse, error) {
	// Create a unique reservation ID
	reservationID := uuid.New().String()
	warehouseID, err := uuid.Parse(req.WarehouseId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid warehouse ID: %v", err)
	}

	// Check and reserve stock for each product
	availabilityList := make([]*pb.ProductAvailability, 0, len(req.Items))
	success := true
	
	for _, item := range req.Items {
		// First, check if the item exists
		var itemObj *models.Item
		var itemID uuid.UUID
		
		if item.ProductId != "" {
			// Try to lookup by product ID
			itemObj, err = s.itemService.GetItem(ctx, item.ProductId)
			if err != nil {
				availabilityList = append(availabilityList, &pb.ProductAvailability{
					ProductId:    item.ProductId,
					Sku:          item.Sku,
					InStock:      false,
					ErrorMessage: fmt.Sprintf("item not found: %v", err),
				})
				success = false
				continue
			}
			itemID, _ = uuid.Parse(item.ProductId)
		} else if item.Sku != "" {
			// Try to lookup by SKU
			itemObj, err = s.itemService.GetItemBySKU(ctx, item.Sku)
			if err != nil {
				availabilityList = append(availabilityList, &pb.ProductAvailability{
					ProductId:    "",
					Sku:          item.Sku,
					InStock:      false,
					ErrorMessage: fmt.Sprintf("item not found: %v", err),
				})
				success = false
				continue
			}
			itemID, _ = uuid.Parse(itemObj.ID)
		} else {
			return nil, status.Errorf(codes.InvalidArgument, "product_id or sku must be provided")
		}

		// Now check inventory level
		level, err := s.inventoryService.GetInventoryLevelForItem(ctx, itemID, warehouseID)
		if err != nil {
			availabilityList = append(availabilityList, &pb.ProductAvailability{
				ProductId:    itemObj.ID,
				Sku:          itemObj.SKU,
				InStock:      false,
				ErrorMessage: fmt.Sprintf("failed to get inventory level: %v", err),
			})
			success = false
			continue
		}

		// Check if there's enough available inventory
		if level.Available < int64(item.Quantity) {
			availabilityList = append(availabilityList, &pb.ProductAvailability{
				ProductId:         itemObj.ID,
				Sku:               itemObj.SKU,
				InStock:           false,
				AvailableQuantity: int32(level.Available),
				ErrorMessage:      fmt.Sprintf("insufficient stock: requested %d, available %d", item.Quantity, level.Available),
			})
			success = false
			continue
		}

		// Reserve the inventory
		err = s.inventoryService.AllocateInventory(ctx, itemID, int64(item.Quantity), reservationID, warehouseID, "system")
		if err != nil {
			availabilityList = append(availabilityList, &pb.ProductAvailability{
				ProductId:         itemObj.ID,
				Sku:               itemObj.SKU,
				InStock:           true,
				AvailableQuantity: int32(level.Available),
				ErrorMessage:      fmt.Sprintf("failed to allocate inventory: %v", err),
			})
			success = false
			continue
		}

		// Successfully reserved
		availabilityList = append(availabilityList, &pb.ProductAvailability{
			ProductId:         itemObj.ID,
			Sku:               itemObj.SKU,
			InStock:           true,
			AvailableQuantity: int32(level.Available - int64(item.Quantity)),
		})
	}

	// Return the response
	message := "Stock reserved successfully"
	if !success {
		message = "Some items could not be reserved"
	}

	return &pb.StockReservationResponse{
		Success:       success,
		ReservationId: reservationID,
		Items:         availabilityList,
		Message:       message,
	}, nil
}

// ReleaseReservedStock releases stock that was previously reserved
func (s *InventoryServer) ReleaseReservedStock(ctx context.Context, req *pb.ReleaseStockRequest) (*pb.ReleaseStockResponse, error) {
	// Find inventory levels with matching reservation ID (which will be the order_id in the reference)
	success := true
	message := "Stock released successfully"
	
	// We'll keep track of release operations for transaction tracking
	releaseOps := 0
	
	// Go through each warehouse to find allocations for this reservation
	warehouses, err := s.inventoryService.GetWarehouses(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get warehouses: %v", err)
	}

	for _, _ = range warehouses {
		// Get transactions for this reservation
		transactions, _, err := s.inventoryService.GetInventoryTransactions(
			ctx, 
			map[string]interface{}{
				"reference": req.ReservationId,
				"type": "allocate",
			}, 
			1, 100)
		
		if err != nil {
			success = false
			message = fmt.Sprintf("failed to get transactions: %v", err)
			continue
		}

		// Release each transaction
		for _, tx := range transactions {
			err = s.inventoryService.ReleaseInventory(
				ctx, 
				tx.ItemID, 
				tx.Quantity, 
				req.OrderId, 
				tx.WarehouseID, 
				"system")
			
			if err != nil {
				success = false
				message = fmt.Sprintf("failed to release inventory: %v", err)
				continue
			}
			
			releaseOps++
		}
	}

	if releaseOps == 0 && success {
		message = "No matching reservations found to release"
		success = false
	}

	return &pb.ReleaseStockResponse{
		Success: success,
		Message: message,
	}, nil
}

func (s *InventoryServer) CommitReservation(ctx context.Context, req *pb.CommitReservationRequest) (*pb.CommitReservationResponse, error) {
	

	
	return &pb.CommitReservationResponse{
		Success: true,
		Message: fmt.Sprintf("Reservation %s committed successfully for order %s", req.ReservationId, req.OrderId),
	}, nil
}


func convertItemToProto(item *models.Item) *pb.Item {
	attributes := make(map[string]string)
	for k, v := range item.Attributes {
		switch val := v.(type) {
		case string:
			attributes[k] = val
		default:
			attributes[k] = fmt.Sprintf("%v", val)
		}
	}

	return &pb.Item{
		Id:          item.ID,
		Sku:         item.SKU,
		Name:        item.Name,
		Description: item.Description,
		Category:    item.Category,
		Attributes:  attributes,
		CreatedAt:   timestamppb.New(item.CreatedAt),
		UpdatedAt:   timestamppb.New(item.UpdatedAt),
	}
}

func convertInventoryLevelToProto(level *models.InventoryLevel) *pb.InventoryLevel {
	return &pb.InventoryLevel{
		ItemId:      level.ItemID.String(),
		LocationId:  level.WarehouseID.String(), 
		Quantity:    level.Quantity,
		Reserved:    level.Reserved,
		Available:   level.Available,
		LastUpdated: timestamppb.New(level.LastUpdated),
	}
} 