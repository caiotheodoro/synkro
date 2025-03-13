package tests

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"github.com/synkro/inventory-sync-service/src/api/grpc"
	"github.com/synkro/inventory-sync-service/src/config"
	"github.com/synkro/inventory-sync-service/src/di"
	"github.com/synkro/inventory-sync-service/src/models"
	pb "github.com/synkro/inventory-sync-service/src/proto"
	grpcserver "google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/test/bufconn"
)

const bufSize = 1024 * 1024

type LogisticsIntegrationSuite struct {
	suite.Suite
	container       *di.Container
	server          *grpcserver.Server
	listener        *bufconn.Listener
	client          pb.InventoryServiceClient
	testWarehouseID uuid.UUID
	testItems       []*models.Item
	ctx             context.Context
	reservationID   string
}

func (s *LogisticsIntegrationSuite) SetupSuite() {
	// Load test environment variables
	if err := godotenv.Load("../.env.test"); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("No .env.test or .env file found. Using environment variables.")
		}
	}

	// Initialize context
	s.ctx = context.Background()

	// Load configuration
	cfg := config.Load()

	// Initialize DI container
	container, err := di.NewContainer(cfg)
	if err != nil {
		s.T().Fatalf("Failed to initialize container: %v", err)
	}
	s.container = container

	// Run migrations
	if err := container.DB.RunMigrations(s.ctx); err != nil {
		s.T().Fatalf("Failed to run migrations: %v", err)
	}

	// Create a buffer for gRPC communication
	s.listener = bufconn.Listen(bufSize)

	// Initialize gRPC server
	inventoryServer := grpc.NewInventoryServer(container.ItemService, container.InventoryService)
	s.server = grpcserver.NewServer()
	pb.RegisterInventoryServiceServer(s.server, inventoryServer)
	reflection.Register(s.server)

	// Start server
	go func() {
		if err := s.server.Serve(s.listener); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Create a client connection
	conn, err := grpc.NewBufDialer(s.listener)
	if err != nil {
		s.T().Fatalf("Failed to dial buffer: %v", err)
	}

	s.client = pb.NewInventoryServiceClient(conn)

	// Create test data
	s.createTestData()
}

func (s *LogisticsIntegrationSuite) TearDownSuite() {
	// Clean up test data
	s.cleanupTestData()

	// Gracefully stop the server
	s.server.GracefulStop()

	// Close the container
	if err := s.container.Close(); err != nil {
		s.T().Logf("Error closing container: %v", err)
	}
}

func (s *LogisticsIntegrationSuite) createTestData() {
	// Create a test warehouse
	warehouseID := uuid.New()
	s.testWarehouseID = warehouseID
	
	// Create the warehouse in the database
	unique := uuid.New().String()[:8]
	warehouse := &models.Warehouse{
		ID:         warehouseID.String(),
		Code:       fmt.Sprintf("TEST-WH-%s", unique),
		Name:       fmt.Sprintf("Test Warehouse %s", unique),
		Address: models.Address{
			AddressLine1: "123 Test St",
			AddressLine2: "Unit 456",
			City:        "Test City",
			State:       "TS",
			PostalCode:  "12345",
			Country:     "US",
		},
		ContactName: "Test Contact",
		ContactPhone: "123-456-7890",
		ContactEmail: "test@example.com",
		Active:     true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	
	err := s.container.WarehouseRepository.CreateWarehouse(s.ctx, warehouse)
	if err != nil {
		s.T().Fatalf("Failed to create test warehouse: %v", err)
	}

	// Create test items
	items := make([]*models.Item, 0)
	for i := 0; i < 3; i++ {
		// Create item object
		item := &models.Item{
			ID:          uuid.New().String(),
			SKU:         fmt.Sprintf("TEST-SKU-%d", i),
			Name:        fmt.Sprintf("Test Item %d", i),
			Description: "Integration test item",
			Category:    "Test",
			Attributes: models.JSONMap{
				"color": "blue",
				"size":  "medium",
			},
			WarehouseID: s.testWarehouseID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		
		// Create the item
		err := s.container.ItemService.CreateItem(s.ctx, item)
		if err != nil {
			s.T().Fatalf("Failed to create test item: %v", err)
		}
		items = append(items, item)

		// Add inventory for the item
		itemID, _ := uuid.Parse(item.ID)
		_, err = s.container.InventoryService.AdjustInventory(
			s.ctx,
			itemID,
			100,
			"Initial test inventory",
			fmt.Sprintf("TEST-REF-%d", i),
			warehouseID,
		)
		if err != nil {
			s.T().Fatalf("Failed to add inventory: %v", err)
		}
	}
	s.testItems = items
}

func (s *LogisticsIntegrationSuite) cleanupTestData() {
	// Delete test items
	for _, item := range s.testItems {
		err := s.container.ItemService.DeleteItem(s.ctx, item.ID)
		if err != nil {
			s.T().Logf("Error deleting test item %s: %v", item.ID, err)
		}
	}
}

// Helper function for creating a bufconn client
func (s *LogisticsIntegrationSuite) getBufconnClient() (pb.InventoryServiceClient, error) {
	conn, err := grpc.NewBufDialer(s.listener)
	if err != nil {
		return nil, err
	}
	return pb.NewInventoryServiceClient(conn), nil
}

// Helper function for creating a regular gRPC client
func getGRPCClient(target string) (pb.InventoryServiceClient, error) {
	conn, err := grpcserver.Dial(target, grpcserver.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return pb.NewInventoryServiceClient(conn), nil
}

// Test CheckAndReserveStock functionality
func (s *LogisticsIntegrationSuite) TestACheckAndReserveStock() {
	// Arrange
	req := &pb.StockReservationRequest{
		OrderId:     uuid.New().String(),
		WarehouseId: s.testWarehouseID.String(),
		Items: []*pb.ProductItem{
			{
				ProductId: s.testItems[0].ID,
				Sku:       s.testItems[0].SKU,
				Quantity:  10,
			},
		},
	}

	// Before the operation, get the initial inventory level
	itemID, _ := uuid.Parse(s.testItems[0].ID)
	initialLevel, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	initialAvailable := initialLevel.Available
	
	// Act
	resp, err := s.client.CheckAndReserveStock(s.ctx, req)

	// Assert
	assert.NoError(s.T(), err, "CheckAndReserveStock should not return an error")
	assert.NotNil(s.T(), resp, "Response should not be nil")
	assert.True(s.T(), resp.Success, "Reservation should be successful")
	assert.NotEmpty(s.T(), resp.ReservationId, "Reservation ID should not be empty")
	assert.Len(s.T(), resp.Items, 1, "Should have one item availability")
	assert.True(s.T(), resp.Items[0].InStock, "Item should be in stock")
	
	// Get the current inventory level
	level, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	
	// Verify that reserved increased by 10 and available decreased by 10
	assert.Equal(s.T(), int64(10), level.Reserved, "Reserved quantity should be 10")
	assert.Equal(s.T(), initialAvailable-int64(10), level.Available, "Available quantity should decrease by 10")
	
	// Store the reservationID for other tests
	s.reservationID = resp.ReservationId
}

// Test ReleaseReservedStock functionality
func (s *LogisticsIntegrationSuite) TestBReleaseReservedStock() {
	// Skip this test if no reservation ID is available from previous test
	if s.reservationID == "" {
		s.T().Skip("Skipping test because no reservation ID is available")
	}

	// Get item ID and initial inventory levels
	itemID, _ := uuid.Parse(s.testItems[0].ID)
	initialLevel, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	initialReserved := initialLevel.Reserved
	initialAvailable := initialLevel.Available

	// Act - Release the reservation
	req := &pb.ReleaseStockRequest{
		ReservationId: s.reservationID,
		Reason:        "Test release",
	}
	resp, err := s.client.ReleaseReservedStock(s.ctx, req)

	// Assert
	assert.NoError(s.T(), err, "ReleaseReservedStock should not return an error")
	assert.NotNil(s.T(), resp, "Response should not be nil")
	assert.True(s.T(), resp.Success, "Release should be successful")

	// Verify the inventory was updated correctly
	level, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	
	// Reserved should decrease and available should increase
	assert.Less(s.T(), level.Reserved, initialReserved, "Reserved quantity should decrease")
	assert.Greater(s.T(), level.Available, initialAvailable, "Available quantity should increase")
}

// Test CommitReservation functionality
func (s *LogisticsIntegrationSuite) TestCCommitReservation() {
	// First create a new reservation for committing
	orderID := uuid.New().String()
	req := &pb.StockReservationRequest{
		OrderId:     orderID,
		WarehouseId: s.testWarehouseID.String(),
		Items: []*pb.ProductItem{
			{
				ProductId: s.testItems[0].ID,
				Sku:       s.testItems[0].SKU,
				Quantity:  10,
			},
		},
	}
	
	// Create the reservation
	resp, err := s.client.CheckAndReserveStock(s.ctx, req)
	assert.NoError(s.T(), err, "CheckAndReserveStock should not return an error")
	assert.NotNil(s.T(), resp, "Response should not be nil")
	assert.True(s.T(), resp.Success, "Reservation should be successful")
	
	reservationID := resp.ReservationId

	// Get item ID and initial inventory levels
	itemID, _ := uuid.Parse(s.testItems[0].ID)
	initialLevel, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	initialQuantity := initialLevel.Quantity
	initialReserved := initialLevel.Reserved

	// Act - Commit the reservation
	commitReq := &pb.CommitReservationRequest{
		ReservationId: reservationID,
	}
	commitResp, err := s.client.CommitReservation(s.ctx, commitReq)

	// Assert
	assert.NoError(s.T(), err, "CommitReservation should not return an error")
	assert.NotNil(s.T(), commitResp, "Response should not be nil")
	assert.True(s.T(), commitResp.Success, "Commit should be successful")

	// Verify the inventory was updated correctly
	level, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	
	// Quantity and reserved should decrease (commit means the items are shipped)
	assert.Less(s.T(), level.Quantity, initialQuantity, "Quantity should decrease")
	assert.Less(s.T(), level.Reserved, initialReserved, "Reserved quantity should decrease")
}

// Test GetInventoryLevels functionality
func (s *LogisticsIntegrationSuite) TestDGetInventoryLevels() {
	// Arrange
	req := &pb.GetInventoryLevelsRequest{
		LocationIds: []string{s.testWarehouseID.String()},
	}

	// Act
	resp, err := s.client.GetInventoryLevels(s.ctx, req)

	// Assert
	assert.NoError(s.T(), err, "GetInventoryLevels should not return an error")
	assert.NotNil(s.T(), resp, "Response should not be nil")
	assert.GreaterOrEqual(s.T(), len(resp.Levels), 3, "Should have at least 3 inventory levels")
}

// Run the test suite
func TestLogisticsIntegrationSuite(t *testing.T) {
	if os.Getenv("SKIP_INTEGRATION_TESTS") == "true" {
		t.Skip("Skipping integration tests")
	}
	suite.Run(t, new(LogisticsIntegrationSuite))
}

// Add the buffer dialer function to the grpc package
func init() {
	grpc.NewBufDialer = func(listener *bufconn.Listener) (grpcserver.ClientConnInterface, error) {
		return grpcserver.DialContext(
			context.Background(),
			"bufnet",
			grpcserver.WithContextDialer(func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			}),
			grpcserver.WithTransportCredentials(insecure.NewCredentials()),
		)
	}
} 