package main

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/synkro/inventory-sync-service/src/proto"
)

// Simple test client for manual testing
func TestInventoryClient(t *testing.T) {
	// Connect to gRPC server
	fmt.Println("Connecting to gRPC server on localhost:50051...")
	conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewInventoryServiceClient(conn)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Try a simple health check by creating an item
	fmt.Println("Creating a test item...")
	createReq := &pb.CreateItemRequest{
		Sku:         "TEST-SKU-" + uuid.New().String()[:8],
		Name:        "Test Item from Integration Test",
		Description: "Created by the client test",
		Category:    "Test",
		Attributes: map[string]string{
			"color": "blue",
			"size":  "medium",
		},
	}

	createResp, err := client.CreateItem(ctx, createReq)
	if err != nil {
		t.Fatalf("Failed to create item: %v", err)
	}
	
	fmt.Printf("Item created successfully with ID: %s\n", createResp.Item.Id)
	
	// Generate a warehouse ID (normally this would come from the database)
	warehouseID := uuid.New().String()
	
	// 2. Add inventory for the item
	fmt.Println("Adding inventory for the item...")
	adjustReq := &pb.AdjustInventoryRequest{
		ItemId:     createResp.Item.Id,
		Quantity:   100,
		Reason:     "Initial stock for testing",
		LocationId: warehouseID,
		Reference:  "INIT-" + uuid.New().String()[:8],
	}

	_, err = client.AdjustInventory(ctx, adjustReq)
	if err != nil {
		t.Fatalf("Failed to adjust inventory: %v", err)
	}
	
	fmt.Println("Inventory added successfully")
	
	// 3. Test the CheckAndReserveStock method
	fmt.Println("Testing CheckAndReserveStock...")
	orderID := "TEST-ORDER-" + uuid.New().String()[:8]
	
	reserveReq := &pb.StockReservationRequest{
		OrderId:     orderID,
		WarehouseId: warehouseID,
		Items: []*pb.ProductItem{
			{
				ProductId: createResp.Item.Id,
				Sku:       createResp.Item.Sku,
				Quantity:  10,
			},
		},
	}

	reserveResp, err := client.CheckAndReserveStock(ctx, reserveReq)
	if err != nil {
		t.Fatalf("Failed to reserve stock: %v", err)
	}
	
	fmt.Printf("Stock reservation successful: %v, Reservation ID: %s\n", 
		reserveResp.Success, reserveResp.ReservationId)
	
	// 4. Test CommitReservation
	fmt.Println("Testing CommitReservation...")
	commitReq := &pb.CommitReservationRequest{
		ReservationId: reserveResp.ReservationId,
		OrderId:       orderID,
	}
	
	commitResp, err := client.CommitReservation(ctx, commitReq)
	if err != nil {
		t.Fatalf("Failed to commit reservation: %v", err)
	}
	
	fmt.Printf("Reservation committed successfully: %v, Message: %s\n", 
		commitResp.Success, commitResp.Message)
		
	// 5. Make another reservation for testing release
	fmt.Println("Making another reservation for testing release...")
	orderID2 := "TEST-ORDER-" + uuid.New().String()[:8]
	
	reserveReq2 := &pb.StockReservationRequest{
		OrderId:     orderID2,
		WarehouseId: warehouseID,
		Items: []*pb.ProductItem{
			{
				ProductId: createResp.Item.Id,
				Sku:       createResp.Item.Sku,
				Quantity:  5,
			},
		},
	}

	reserveResp2, err := client.CheckAndReserveStock(ctx, reserveReq2)
	if err != nil {
		t.Fatalf("Failed to make second reservation: %v", err)
	}
	
	fmt.Printf("Second stock reservation successful: %v, Reservation ID: %s\n", 
		reserveResp2.Success, reserveResp2.ReservationId)
	
	// 6. Test ReleaseReservedStock
	fmt.Println("Testing ReleaseReservedStock...")
	releaseReq := &pb.ReleaseStockRequest{
		ReservationId: reserveResp2.ReservationId,
		OrderId:       orderID2,
		Reason:        "Testing release functionality",
	}
	
	releaseResp, err := client.ReleaseReservedStock(ctx, releaseReq)
	if err != nil {
		t.Fatalf("Failed to release stock: %v", err)
	}
	
	fmt.Printf("Stock released successfully: %v, Message: %s\n", 
		releaseResp.Success, releaseResp.Message)
		
	// 7. Check final inventory level
	fmt.Println("Checking final inventory level...")
	getInvReq := &pb.GetInventoryLevelsRequest{}
	
	getInvResp, err := client.GetInventoryLevels(ctx, getInvReq)
	if err != nil {
		t.Fatalf("Failed to get inventory levels: %v", err)
	}
	
	fmt.Printf("Found %d inventory levels in the system\n", len(getInvResp.Levels))
	for _, level := range getInvResp.Levels {
		if level.ItemId == createResp.Item.Id {
			fmt.Printf("Item %s: Quantity=%d, Reserved=%d, Available=%d\n", 
				level.ItemId, level.Quantity, level.Reserved, level.Available)
		}
	}
	
	fmt.Println("Integration test completed successfully!")
} 