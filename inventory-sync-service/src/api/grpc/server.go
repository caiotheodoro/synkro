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
	// Convert request to Item model
	attributes := make(map[string]interface{})
	for k, v := range req.Attributes {
		attributes[k] = v
	}

	now := time.Now()
	itemID := uuid.New().String()
	
	// We need to assign a warehouse ID - for now, we'll use a default warehouse
	// In a real implementation, this would be passed in the request or handled differently
	warehouseID, err := uuid.Parse(req.LocationId)
	if err != nil || req.LocationId == "" {
		// If location ID is not provided or invalid, generate a random one
		warehouseID = uuid.New()
	}
	
	item := &models.Item{
		ID:          itemID,
		SKU:         req.Sku,
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Attributes:  attributes,
		WarehouseID: warehouseID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Create item
	err = s.itemService.CreateItem(ctx, item)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create item: %v", err)
	}

	// Convert to response
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
	// Fetch the existing item first
	existingItem, err := s.itemService.GetItem(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "item not found: %v", err)
	}

	// Update fields if provided
	if req.Name != "" {
		existingItem.Name = req.Name
	}
	if req.Description != "" {
		existingItem.Description = req.Description
	}
	if req.Category != "" {
		existingItem.Category = req.Category
	}
	
	// Update attributes if provided
	if len(req.Attributes) > 0 {
		for k, v := range req.Attributes {
			if existingItem.Attributes == nil {
				existingItem.Attributes = make(map[string]interface{})
			}
			existingItem.Attributes[k] = v
		}
	}
	existingItem.UpdatedAt = time.Now()

	// Save changes
	err = s.itemService.UpdateItem(ctx, existingItem)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update item: %v", err)
	}

	return &pb.ItemResponse{
		Item: convertItemToProto(existingItem),
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
	// Prepare filter
	filter := models.ItemFilter{
		Page:     int(req.Page),
		PageSize: int(req.PageSize),
		Category: req.Category,
	}
	
	// If pagination values are not provided, set defaults
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 10
	}
	
	// Set up extended filter properties
	extended := models.ItemFilterExtended{
		// Default sort by created_at desc
		SortBy:   "created_at",
		SortDesc: true,
		Limit:    filter.PageSize,
		Offset:   filter.PageSize * (filter.Page - 1),
	}

	// Get items
	items, err := s.itemService.ListItems(ctx, filter, extended)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list items: %v", err)
	}

	// Convert to response
	protoItems := make([]*pb.Item, len(items))
	for i, item := range items {
		protoItems[i] = convertItemToProto(item)
	}

	// Estimate total count (we don't have a count method, so we estimate)
	estimatedTotal := len(items)
	if len(items) == filter.PageSize {
		// There might be more items, so we add 1 to indicate there are more
		estimatedTotal = filter.Page * filter.PageSize + 1
	}

	return &pb.ListItemsResponse{
		Items:    protoItems,
		Total:    int32(estimatedTotal),
		Page:     int32(filter.Page),
		PageSize: int32(filter.PageSize),
	}, nil
}

// AdjustInventory adds or removes inventory
func (s *InventoryServer) AdjustInventory(ctx context.Context, req *pb.AdjustInventoryRequest) (*pb.AdjustInventoryResponse, error) {
	// Validate request
	itemID, err := uuid.Parse(req.ItemId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid item ID: %v", err)
	}

	locationID, err := uuid.Parse(req.LocationId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid location ID: %v", err)
	}

	// Determine operation based on quantity sign
	level, err := s.inventoryService.AdjustInventory(
		ctx, 
		itemID, 
		req.Quantity, 
		req.Reason, 
		req.Reference, 
		locationID,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to adjust inventory: %v", err)
	}

	// Convert level to response
	return &pb.AdjustInventoryResponse{
		InventoryLevel: convertInventoryLevelToProto(level),
	}, nil
}

// AllocateInventory reserves inventory for an order
func (s *InventoryServer) AllocateInventory(ctx context.Context, req *pb.AllocateInventoryRequest) (*pb.AllocateInventoryResponse, error) {
	// Validate request
	itemID, err := uuid.Parse(req.ItemId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid item ID: %v", err)
	}

	locationID, err := uuid.Parse(req.LocationId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid location ID: %v", err)
	}

	// Allocate inventory
	err = s.inventoryService.AllocateInventory(
		ctx, 
		itemID, 
		req.Quantity, 
		req.OrderId, // Using OrderId as the reservation ID
		locationID, 
		"system", // Default user ID for system operations
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to allocate inventory: %v", err)
	}

	// Get the updated inventory level
	level, err := s.inventoryService.GetInventoryLevelForItem(ctx, itemID, locationID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get updated inventory level: %v", err)
	}

	// Return success response
	return &pb.AllocateInventoryResponse{
		Success: true,
		InventoryLevel: convertInventoryLevelToProto(level),
	}, nil
}

// ReleaseInventory releases reserved inventory
func (s *InventoryServer) ReleaseInventory(ctx context.Context, req *pb.ReleaseInventoryRequest) (*pb.ReleaseInventoryResponse, error) {
	// Validate request
	itemID, err := uuid.Parse(req.ItemId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid item ID: %v", err)
	}

	locationID, err := uuid.Parse(req.LocationId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid location ID: %v", err)
	}
	
	// In our implementation, we release by reservation ID, but the proto expects to release
	// by item, quantity, and location. We'll need to find the appropriate reservation.
	// For now, we'll use the order_id as a lookup key for the reservation.
	
	// Get transactions for this order
	transactions, _, err := s.inventoryService.GetInventoryTransactions(
		ctx, 
		map[string]interface{}{
			"reference": req.OrderId,
			"type": "allocate",
		}, 
		1, 100)
	
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get transactions: %v", err)
	}
	
	// Find the matching transaction
	var matchingTx *models.InventoryTransaction
	for _, tx := range transactions {
		if tx.ItemID == itemID && tx.WarehouseID == locationID {
			matchingTx = &tx
			break
		}
	}
	
	if matchingTx == nil {
		return nil, status.Errorf(codes.NotFound, "no matching reservation found")
	}
	
	// Release the reservation
	err = s.inventoryService.ReleaseInventory(ctx, matchingTx.Reference, "Released by API request")
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to release inventory: %v", err)
	}
	
	// Get the updated inventory level
	level, err := s.inventoryService.GetInventoryLevelForItem(ctx, itemID, locationID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get updated inventory level: %v", err)
	}

	// Return success response
	return &pb.ReleaseInventoryResponse{
		Success: true,
		InventoryLevel: convertInventoryLevelToProto(level),
	}, nil
}

// BulkCreateItems creates multiple items in a batch
func (s *InventoryServer) BulkCreateItems(ctx context.Context, req *pb.BulkCreateItemsRequest) (*pb.BulkCreateItemsResponse, error) {
	items := make([]*models.Item, len(req.Items))
	
	// Convert requests to models
	now := time.Now()
	for i, itemReq := range req.Items {
		attributes := make(map[string]interface{})
		for k, v := range itemReq.Attributes {
			attributes[k] = v
		}
		
		// Get or generate warehouse ID 
		warehouseID, err := uuid.Parse(itemReq.LocationId)
		if err != nil || itemReq.LocationId == "" {
			// If location ID is not provided or invalid, generate a random one
			warehouseID = uuid.New()
		}
		
		items[i] = &models.Item{
			ID:          uuid.New().String(),
			SKU:         itemReq.Sku,
			Name:        itemReq.Name,
			Description: itemReq.Description,
			Category:    itemReq.Category,
			Attributes:  attributes,
			WarehouseID: warehouseID,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
	}
	
	// Process bulk operation
	err := s.itemService.BulkCreateItems(ctx, items)
	if err != nil {
		return &pb.BulkCreateItemsResponse{
			Items:        nil,
			SuccessCount: 0,
			FailureCount: int32(len(items)),
			Errors:       []string{err.Error()},
		}, nil
	}
	
	// Create response with created items
	protoItems := make([]*pb.Item, len(items))
	for i, item := range items {
		protoItems[i] = convertItemToProto(item)
	}
	
	return &pb.BulkCreateItemsResponse{
		Items:        protoItems,
		SuccessCount: int32(len(items)),
		FailureCount: 0,
		Errors:       []string{},
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
	// Create a report filter from the request
	filter := models.ReportFilter{
		WarehouseID:  req.LocationId,
		Category:     req.Category,
		LowStockOnly: req.LowStockOnly,
	}
	
	// Generate the report
	report, err := s.inventoryService.GetInventoryReport(ctx, filter)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate inventory report: %v", err)
	}
	
	// Convert to proto report items
	protoItems := make([]*pb.InventoryReportItem, len(report.Items))
	for i, item := range report.Items {
		// Get the item details
		itemObj, err := s.itemService.GetItem(ctx, item.ItemID.String())
		if err != nil {
			continue
		}
		
		protoItems[i] = &pb.InventoryReportItem{
			Item: convertItemToProto(itemObj),
			InventoryLevel: &pb.InventoryLevel{
				ItemId:      item.ItemID.String(),
				Quantity:    item.Quantity,
				Reserved:    item.Reserved,
				Available:   item.Available,
				LocationId:  report.WarehouseID.String(),
				LastUpdated: timestamppb.New(item.LastUpdated),
			},
			RequiresReorder: item.IsLowStock,
		}
	}
	
	return &pb.InventoryReportResponse{
		Items:         protoItems,
		TotalItems:    int32(report.Summary.TotalItems),
		TotalQuantity: int32(report.Summary.TotalQuantity),
		LowStockCount: int32(report.Summary.LowStockItems),
		ReportTime:    timestamppb.New(report.GeneratedAt),
	}, nil
}

// GetInventoryLevels returns all inventory levels
func (s *InventoryServer) GetInventoryLevels(ctx context.Context, req *pb.GetInventoryLevelsRequest) (*pb.GetInventoryLevelsResponse, error) {
	// Get all inventory levels
	filter := models.InventoryFilter{}
	extended := models.InventoryFilterExtended{}
	
	// Apply item and location filters if provided
	if len(req.ItemIds) > 0 && len(req.ItemIds[0]) > 0 {
		filter.ItemID = req.ItemIds[0] // For simplicity, just use the first item ID
	}
	
	if len(req.LocationIds) > 0 && len(req.LocationIds[0]) > 0 {
		filter.WarehouseID = req.LocationIds[0] // For simplicity, just use the first location ID
	}
	
	// Get inventory levels using the filter
	levels, err := s.inventoryService.ListInventoryLevels(ctx, filter, extended)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list inventory levels: %v", err)
	}
	
	protoLevels := make([]*pb.InventoryLevel, len(levels))
	for i, level := range levels {
		protoLevels[i] = convertInventoryLevelToProto(level)
	}
	
	return &pb.GetInventoryLevelsResponse{
		Levels: protoLevels,
	}, nil
}

// CheckAndReserveStock checks if products are in stock and reserves them
func (s *InventoryServer) CheckAndReserveStock(ctx context.Context, req *pb.StockReservationRequest) (*pb.StockReservationResponse, error) {
	// Create a unique reservation ID
	reservationID := req.OrderId
	if reservationID == "" {
		reservationID = uuid.New().String()
	}
	
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
				ProductId:         itemObj.ID,
				Sku:               itemObj.SKU,
				InStock:           false,
				AvailableQuantity: int32(level.Available),
				ErrorMessage:      fmt.Sprintf("failed to get inventory level: %v", err),
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

		// Create allocation object
		allocation := models.InventoryAllocation{
			ItemID:      itemID,
			WarehouseID: warehouseID,
			OrderID:     reservationID,
			Quantity:    int64(item.Quantity),
		}
		
		// Reserve the inventory
		err = s.inventoryService.AllocateInventory(ctx, allocation.ItemID, allocation.Quantity, allocation.OrderID, allocation.WarehouseID, "system")
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
	// Validate inputs
	if req.ReservationId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "reservation_id is required")
	}
	
	// Determine which ID to use
	reservationID := req.ReservationId
	if reservationID == "" && req.OrderId != "" {
		reservationID = req.OrderId
	}
	
	// Get reason or use default
	reason := req.Reason
	if reason == "" {
		reason = "Release requested via API"
	}
	
	// Release the inventory
	err := s.inventoryService.ReleaseInventory(ctx, reservationID, reason)
	if err != nil {
		return &pb.ReleaseStockResponse{
			Success: false,
			Message: fmt.Sprintf("failed to release stock: %v", err),
		}, status.Errorf(codes.Internal, "failed to release stock: %v", err)
	}

	return &pb.ReleaseStockResponse{
		Success: true,
		Message: "Stock released successfully",
	}, nil
}

// CommitReservation commits a previous reservation (finalizes the order)
func (s *InventoryServer) CommitReservation(ctx context.Context, req *pb.CommitReservationRequest) (*pb.CommitReservationResponse, error) {
	// Validate inputs
	if req.ReservationId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "reservation_id is required")
	}
	
	// Determine which ID to use
	reservationID := req.ReservationId
	if reservationID == "" && req.OrderId != "" {
		reservationID = req.OrderId
	}
	
	// Commit the reservation
	err := s.inventoryService.CommitReservation(ctx, reservationID)
	if err != nil {
		return &pb.CommitReservationResponse{
			Success: false,
			Message: fmt.Sprintf("failed to commit reservation: %v", err),
		}, status.Errorf(codes.Internal, "failed to commit reservation: %v", err)
	}

	return &pb.CommitReservationResponse{
		Success: true,
		Message: "Reservation committed successfully",
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