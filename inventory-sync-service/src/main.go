package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/synkro/inventory-sync-service/src/api/grpc"
	"github.com/synkro/inventory-sync-service/src/api/rest"
	"github.com/synkro/inventory-sync-service/src/config"
	"github.com/synkro/inventory-sync-service/src/di"
	"github.com/synkro/inventory-sync-service/src/middleware"
	pb "github.com/synkro/inventory-sync-service/src/proto"
	grpcserver "google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading it. Using environment variables and defaults.")
	}

	cfg := config.Load()

	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
		log.Println("Running in production mode - loading actual data from the database")
	} else {
		log.Println("Running in development mode")
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Initialize DI container
	container, err := di.NewContainer(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize the application: %v", err)
	}
	defer container.Close()

	// Run database migrations
	if err := container.DB.RunMigrations(ctx); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize gRPC server
	inventoryServer := grpc.NewInventoryServer(container.ItemService, container.InventoryService)
	grpcServer := grpcserver.NewServer()
	pb.RegisterInventoryServiceServer(grpcServer, inventoryServer)
	
	// Register reflection service on gRPC server for easier debugging
	reflection.Register(grpcServer)

	grpcListener, err := net.Listen("tcp", cfg.Server.GRPCPort)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	go func() {
		log.Printf("Starting gRPC server on port %s", cfg.Server.GRPCPort)
		if err := grpcServer.Serve(grpcListener); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// Initialize HTTP server
	router := gin.Default()
	
	// Health check endpoint (no auth required)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})
	
	// Set up API routes with auth middleware
	apiRouter := router.Group("/api/v1")
	apiRouter.Use(middleware.AuthMiddleware())
	
	// Initialize our REST handler
	restHandler := rest.NewHandler(container.ItemService, container.InventoryService, container.WarehouseService)
	
	// Register routes to the secured API router
	registerSecureRoutes(apiRouter, restHandler)
	
	// Log all registered routes
	for _, route := range router.Routes() {
		log.Printf("Registered route: %s %s", route.Method, route.Path)
	}

	srv := &http.Server{
		Addr:    cfg.Server.HTTPPort,
		Handler: router,
	}

	go func() {
		log.Printf("Starting HTTP server on port %s", cfg.Server.HTTPPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("failed to serve HTTP: %v", err)
		}
	}()

	<-ctx.Done()

	log.Println("Shutting down servers...")
	
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	grpcServer.GracefulStop()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("HTTP server forced to shutdown: %v", err)
	}
	
	log.Println("Servers shut down gracefully")
}

// registerSecureRoutes registers all the API routes with the auth middleware
func registerSecureRoutes(router *gin.RouterGroup, h *rest.Handler) {
	// Items routes
	items := router.Group("/items")
	{
		items.GET("", h.ListItems)
		items.GET("/:id", h.GetItem)
		items.POST("", h.CreateItem)
		items.PUT("/:id", h.UpdateItem)
		items.DELETE("/:id", h.DeleteItem)
		items.POST("/bulk", h.BulkCreateItems)
		items.PUT("/bulk", h.BulkUpdateItems)
	}

	// Warehouses routes
	warehouses := router.Group("/warehouses")
	{
		warehouses.GET("", h.ListWarehouses)
		warehouses.GET("/:id", h.GetWarehouse)
		warehouses.POST("", h.CreateWarehouse)
		warehouses.PUT("/:id", h.UpdateWarehouse)
		warehouses.DELETE("/:id", h.DeleteWarehouse)
	}

	// Inventory routes
	inventory := router.Group("/inventory")
	{
		inventory.POST("/adjust", h.AdjustInventory)
		inventory.POST("/allocate", h.AllocateInventory)
		inventory.POST("/release", h.ReleaseInventory)
		inventory.GET("/levels", h.GetInventoryLevels)
	}

	// Reports routes
	reports := router.Group("/reports")
	{
		reports.GET("/inventory", h.GetInventoryReport)
	}
}

func isAlreadyExistsError(err error) bool {
	return err != nil && (containsString(err.Error(), "already exists") || 
		containsString(err.Error(), "duplicate key") || 
		containsString(err.Error(), "unique constraint"))
}

func containsString(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}