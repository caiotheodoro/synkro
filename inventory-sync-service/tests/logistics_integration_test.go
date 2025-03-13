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

	// Create test items
	items := make([]*models.Item, 0)
	for i := 0; i < 3; i++ {
		item, err := s.container.ItemService.CreateItem(s.ctx, models.CreateItemDTO{
			SKU:         fmt.Sprintf("TEST-SKU-%d", i),
			Name:        fmt.Sprintf("Test Item %d", i),
			Description: "Integration test item",
			Category:    "Test",
			Attributes: models.JSONMap{
				"color": "blue",
				"size":  "medium",
			},
		})
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
func (s *LogisticsIntegrationSuite) TestCheckAndReserveStock() {
	// Arrange
	orderID := fmt.Sprintf("TEST-ORDER-%s", uuid.New().String())
	
	// Create request with the first test item
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

	// Act
	resp, err := s.client.CheckAndReserveStock(s.ctx, req)

	// Assert
	assert.NoError(s.T(), err, "CheckAndReserveStock should not return an error")
	assert.NotNil(s.T(), resp, "Response should not be nil")
	assert.True(s.T(), resp.Success, "Reservation should be successful")
	assert.NotEmpty(s.T(), resp.ReservationId, "Reservation ID should not be empty")
	assert.Len(s.T(), resp.Items, 1, "Should have one item availability")
	assert.True(s.T(), resp.Items[0].InStock, "Item should be in stock")
	assert.Equal(s.T(), int32(90), resp.Items[0].AvailableQuantity, "Available quantity should be 90 (100-10)")

	// Verify the reservation by checking inventory level
	itemID, _ := uuid.Parse(s.testItems[0].ID)
	level, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	assert.Equal(s.T(), int64(10), level.Reserved, "Reserved quantity should be 10")
	assert.Equal(s.T(), int64(90), level.Available, "Available quantity should be 90")
}

// Test ReleaseReservedStock functionality
func (s *LogisticsIntegrationSuite) TestReleaseReservedStock() {
	// Arrange - First create a reservation
	orderID := fmt.Sprintf("TEST-ORDER-%s", uuid.New().String())
	
	reserveReq := &pb.StockReservationRequest{
		OrderId:     orderID,
		WarehouseId: s.testWarehouseID.String(),
		Items: []*pb.ProductItem{
			{
				ProductId: s.testItems[1].ID,
				Sku:       s.testItems[1].SKU,
				Quantity:  15,
			},
		},
	}

	reserveResp, err := s.client.CheckAndReserveStock(s.ctx, reserveReq)
	assert.NoError(s.T(), err, "CheckAndReserveStock should not return an error")
	assert.True(s.T(), reserveResp.Success, "Reservation should be successful")

	// Act - Now release the reservation
	releaseReq := &pb.ReleaseStockRequest{
		ReservationId: reserveResp.ReservationId,
		OrderId:       orderID,
		Reason:        "Order cancelled",
	}

	releaseResp, err := s.client.ReleaseReservedStock(s.ctx, releaseReq)

	// Assert
	assert.NoError(s.T(), err, "ReleaseReservedStock should not return an error")
	assert.NotNil(s.T(), releaseResp, "Response should not be nil")
	assert.True(s.T(), releaseResp.Success, "Release should be successful")

	// Verify the release by checking inventory level
	itemID, _ := uuid.Parse(s.testItems[1].ID)
	level, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	assert.Equal(s.T(), int64(0), level.Reserved, "Reserved quantity should be 0")
	assert.Equal(s.T(), int64(100), level.Available, "Available quantity should be 100")
}

// Test CommitReservation functionality
func (s *LogisticsIntegrationSuite) TestCommitReservation() {
	// Arrange - First create a reservation
	orderID := fmt.Sprintf("TEST-ORDER-%s", uuid.New().String())
	
	reserveReq := &pb.StockReservationRequest{
		OrderId:     orderID,
		WarehouseId: s.testWarehouseID.String(),
		Items: []*pb.ProductItem{
			{
				ProductId: s.testItems[2].ID,
				Sku:       s.testItems[2].SKU,
				Quantity:  20,
			},
		},
	}

	reserveResp, err := s.client.CheckAndReserveStock(s.ctx, reserveReq)
	assert.NoError(s.T(), err, "CheckAndReserveStock should not return an error")
	assert.True(s.T(), reserveResp.Success, "Reservation should be successful")

	// Act - Now commit the reservation
	commitReq := &pb.CommitReservationRequest{
		ReservationId: reserveResp.ReservationId,
		OrderId:       orderID,
	}

	commitResp, err := s.client.CommitReservation(s.ctx, commitReq)

	// Assert
	assert.NoError(s.T(), err, "CommitReservation should not return an error")
	assert.NotNil(s.T(), commitResp, "Response should not be nil")
	assert.True(s.T(), commitResp.Success, "Commit should be successful")

	// Verify the commit by checking inventory level
	itemID, _ := uuid.Parse(s.testItems[2].ID)
	level, err := s.container.InventoryService.GetInventoryLevelForItem(s.ctx, itemID, s.testWarehouseID)
	assert.NoError(s.T(), err, "GetInventoryLevelForItem should not return an error")
	assert.Equal(s.T(), int64(0), level.Reserved, "Reserved quantity should be 0")
	assert.Equal(s.T(), int64(80), level.Available, "Available quantity should be 80")
}

// Test GetInventoryLevels functionality
func (s *LogisticsIntegrationSuite) TestGetInventoryLevels() {
	// Arrange
	req := &pb.GetInventoryLevelsRequest{
		WarehouseId: s.testWarehouseID.String(),
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