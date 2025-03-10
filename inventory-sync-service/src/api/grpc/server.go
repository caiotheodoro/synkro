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

	// Convert items to proto
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

// BulkCreateItems creates multiple items at once
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

// BulkUpdateItems updates multiple items at once
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

	// Convert items to proto
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

// StreamInventoryUpdates streams inventory updates
func (s *InventoryServer) StreamInventoryUpdates(req *pb.StreamInventoryUpdatesRequest, stream pb.InventoryService_StreamInventoryUpdatesServer) error {
	// For simplicity, we'll just simulate some updates in a real implementation
	// this would connect to a message queue or event stream
	ctx := stream.Context()

	// Get current inventory levels for the requested items/locations
	levels, err := s.inventoryService.GetInventoryLevels(ctx)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to get inventory levels: %v", err)
	}

	// Send initial state
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

// Helper functions to convert between models and proto

func convertItemToProto(item *models.Item) *pb.Item {
	attributes := make(map[string]string)
	for k, v := range item.Attributes {
		// Convert interface{} to string
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
		LocationId:  level.WarehouseID.String(), // Using LocationId for backward compatibility
		Quantity:    level.Quantity,
		Reserved:    level.Reserved,
		Available:   level.Available,
		LastUpdated: timestamppb.New(level.LastUpdated),
	}
} 