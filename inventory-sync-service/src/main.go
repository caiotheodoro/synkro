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
	"github.com/synkro/inventory-sync-service/src/database"
	pb "github.com/synkro/inventory-sync-service/src/proto"
	"github.com/synkro/inventory-sync-service/src/repository/postgres"
	"github.com/synkro/inventory-sync-service/src/services"
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

	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.RunMigrations(ctx); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	var itemRepo services.ItemRepository
	var inventoryRepo services.InventoryRepository
	var warehouseRepo services.WarehouseRepository

	itemRepo = postgres.NewItemRepository(db.DB)
	inventoryRepo = postgres.NewInventoryRepository(db.DB)
	warehouseRepo = postgres.NewWarehouseRepository(db.DB)

	itemService := services.NewItemService(itemRepo)
	inventoryService := services.NewInventoryService(inventoryRepo, itemRepo, warehouseRepo)

	inventoryServer := grpc.NewInventoryServer(itemService, inventoryService)
	grpcServer := grpcserver.NewServer()
	pb.RegisterInventoryServiceServer(grpcServer, inventoryServer)
	
	// Register reflection service on gRPC server
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

	router := gin.Default()
	restHandler := rest.NewHandler(itemService, inventoryService)
	restHandler.RegisterRoutes(router)
	
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
}

func isAlreadyExistsError(err error) bool {
	return err != nil && (containsString(err.Error(), "already exists") || 
		containsString(err.Error(), "duplicate key") || 
		containsString(err.Error(), "unique constraint"))
}

func containsString(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
} 