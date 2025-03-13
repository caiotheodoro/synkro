package di

import (
	"github.com/synkro/inventory-sync-service/src/config"
	"github.com/synkro/inventory-sync-service/src/database"
	"github.com/synkro/inventory-sync-service/src/repository"
	"github.com/synkro/inventory-sync-service/src/repository/postgres"
	"github.com/synkro/inventory-sync-service/src/services"
)

type Container struct {
	Config           *config.Config
	DB               *database.DB
	ItemRepository   repository.ItemRepository
	InventoryRepository repository.InventoryRepository
	WarehouseRepository repository.WarehouseRepository
	ItemService      services.ItemService
	InventoryService services.InventoryService
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

	container := &Container{
		Config:             cfg,
		DB:                 db,
		ItemRepository:     itemRepo,
		InventoryRepository: inventoryRepo,
		WarehouseRepository: warehouseRepo,
		ItemService:        itemService,
		InventoryService:   inventoryService,
	}

	return container, nil
}

func (c *Container) Close() error {
	if c.DB != nil {
		return c.DB.Close()
	}
	return nil
} 