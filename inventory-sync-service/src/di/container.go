package di

import (
	"github.com/synkro/inventory-sync-service/src/config"
	"github.com/synkro/inventory-sync-service/src/database"
	"github.com/synkro/inventory-sync-service/src/repository"
	"github.com/synkro/inventory-sync-service/src/repository/postgres"
	"github.com/synkro/inventory-sync-service/src/services"
)

type Container struct {
	Config             *config.Config
	DB                 *database.PostgresDB
	ItemRepository     repository.ItemRepository
	InventoryRepository repository.InventoryRepository
	WarehouseRepository repository.WarehouseRepository
	ItemService        services.ItemService
	InventoryService   services.InventoryService
	WarehouseService   services.WarehouseService
}

func NewContainer(cfg *config.Config) (*Container, error) {
	db, err := database.New(cfg)
	if err != nil {
		return nil, err
	}

	itemRepo := postgres.NewItemRepository(db.DB)
	inventoryRepo := postgres.NewInventoryRepository(db.DB)
	warehouseRepo := postgres.NewWarehouseRepository(db.DB)

	itemService := services.NewItemService(itemRepo)
	inventoryService := services.NewInventoryService(inventoryRepo, itemRepo, warehouseRepo)
	warehouseService := services.NewWarehouseService(warehouseRepo)

	container := &Container{
		Config:             cfg,
		DB:                 db,
		ItemRepository:     itemRepo,
		InventoryRepository: inventoryRepo,
		WarehouseRepository: warehouseRepo,
		ItemService:        itemService,
		InventoryService:   inventoryService,
		WarehouseService:   warehouseService,
	}

	return container, nil
}

func (c *Container) Close() error {
	if c.DB != nil {
		return c.DB.Close()
	}
	return nil
} 