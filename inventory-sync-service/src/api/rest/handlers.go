package rest

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/services"
)

type Handler struct {
	itemService      services.ItemService
	inventoryService services.InventoryService
}

func NewHandler(itemService services.ItemService, inventoryService services.InventoryService) *Handler {
	return &Handler{
		itemService:      itemService,
		inventoryService: inventoryService,
	}
}

// RegisterRoutes registers all the API routes
func (h *Handler) RegisterRoutes(router *gin.Engine) {
	// Add debugging
	println("RegisterRoutes called")
	
	// Health check first
	router.GET("/health", h.HealthCheck)
	
	api := router.Group("/api/v1")
	{
		// Items
		items := api.Group("/items")
		{
			items.GET("", h.ListItems)
			items.GET("/:id", h.GetItem)
			items.POST("", h.CreateItem)
			items.PUT("/:id", h.UpdateItem)
			items.DELETE("/:id", h.DeleteItem)
			items.POST("/bulk", h.BulkCreateItems)
			items.PUT("/bulk", h.BulkUpdateItems)
		}

		// Warehouses
		warehouses := api.Group("/warehouses")
		{
			warehouses.GET("", h.ListWarehouses)
			warehouses.GET("/:id", h.GetWarehouse)
			warehouses.POST("", h.CreateWarehouse)
			warehouses.PUT("/:id", h.UpdateWarehouse)
			warehouses.DELETE("/:id", h.DeleteWarehouse)
		}

		// Inventory
		inventory := api.Group("/inventory")
		{
			inventory.POST("/adjust", h.AdjustInventory)
			inventory.POST("/allocate", h.AllocateInventory)
			inventory.POST("/release", h.ReleaseInventory)
			inventory.GET("/levels", h.GetInventoryLevels)
		}

		// Reports
		reports := api.Group("/reports")
		{
			reports.GET("/inventory", h.GetInventoryReport)
		}
	}
	
	// Add debugging
	println("Routes registered:")
	for _, route := range router.Routes() {
		println(route.Method + " " + route.Path)
	}
}

// HealthCheck handles health check requests
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
	})
}

// CreateItem handles item creation
func (h *Handler) CreateItem(c *gin.Context) {
	var dto models.CreateItemDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.itemService.CreateItem(c, dto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

// GetItem handles item retrieval
func (h *Handler) GetItem(c *gin.Context) {
	id := c.Param("id")
	
	item, err := h.itemService.GetItem(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// UpdateItem handles item updates
func (h *Handler) UpdateItem(c *gin.Context) {
	id := c.Param("id")
	
	var dto models.UpdateItemDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.itemService.UpdateItem(c, id, dto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// DeleteItem handles item deletion
func (h *Handler) DeleteItem(c *gin.Context) {
	id := c.Param("id")
	
	err := h.itemService.DeleteItem(c, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ListItems handles item listing
func (h *Handler) ListItems(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	category := c.Query("category")

	items, total, err := h.itemService.ListItems(c, page, pageSize, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":     items,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// BulkCreateItems handles bulk item creation
func (h *Handler) BulkCreateItems(c *gin.Context) {
	var dtos []models.CreateItemDTO
	if err := c.ShouldBindJSON(&dtos); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items, successCount, errors, err := h.itemService.BulkCreateItems(c, dtos)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":         items,
		"success_count": successCount,
		"failure_count": len(dtos) - successCount,
		"errors":        errors,
	})
}

// BulkUpdateItems handles bulk item updates
func (h *Handler) BulkUpdateItems(c *gin.Context) {
	var updates map[string]models.UpdateItemDTO
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items, successCount, errors, err := h.itemService.BulkUpdateItems(c, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":         items,
		"success_count": successCount,
		"failure_count": len(updates) - successCount,
		"errors":        errors,
	})
}

// CreateWarehouse handles warehouse creation
func (h *Handler) CreateWarehouse(c *gin.Context) {
	var warehouse models.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse.ID = uuid.New()
	warehouse.CreatedAt = time.Now()

	if err := h.inventoryService.CreateWarehouse(c, &warehouse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, warehouse)
}

// GetWarehouse handles warehouse retrieval
func (h *Handler) GetWarehouse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}
	
	warehouse, err := h.inventoryService.GetWarehouse(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

// UpdateWarehouse handles warehouse updates
func (h *Handler) UpdateWarehouse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}

	var warehouse models.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse.ID = id
	if err := h.inventoryService.UpdateWarehouse(c, &warehouse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

// DeleteWarehouse handles warehouse deletion
func (h *Handler) DeleteWarehouse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}

	warehouse, err := h.inventoryService.GetWarehouse(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Delete the warehouse
	if err := h.inventoryService.DeleteWarehouse(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Warehouse %s deleted successfully", warehouse.Code),
	})
}

// ListWarehouses handles warehouse listing
func (h *Handler) ListWarehouses(c *gin.Context) {
	warehouses, err := h.inventoryService.GetWarehouses(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouses)
}

// GetInventoryLevelForItem handles getting inventory level for a specific item
func (h *Handler) GetInventoryLevelForItem(c *gin.Context) {
	itemIDStr := c.Query("item_id")
	warehouseIDStr := c.Query("warehouse_id")

	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID format"})
		return
	}

	warehouseID, err := uuid.Parse(warehouseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}

	level, err := h.inventoryService.GetInventoryLevelForItem(c, itemID, warehouseID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, level)
}

// GetInventoryLevels handles getting all inventory levels
func (h *Handler) GetInventoryLevels(c *gin.Context) {
	levels, err := h.inventoryService.GetInventoryLevels(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, levels)
}

// AdjustInventory handles inventory adjustments
func (h *Handler) AdjustInventory(c *gin.Context) {
	var req struct {
		ItemID      string `json:"item_id" binding:"required"`
		WarehouseID string `json:"warehouse_id" binding:"required"`
		Quantity    int64  `json:"quantity" binding:"required"`
		Reference   string `json:"reference" binding:"required"`
		UserID      string `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	itemID, err := uuid.Parse(req.ItemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID format"})
		return
	}

	warehouseID, err := uuid.Parse(req.WarehouseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}

	var adjustErr error
	if req.Quantity > 0 {
		adjustErr = h.inventoryService.AddInventory(c, itemID, req.Quantity, req.Reference, warehouseID, req.UserID)
	} else {
		adjustErr = h.inventoryService.RemoveInventory(c, itemID, -req.Quantity, req.Reference, warehouseID, req.UserID)
	}

	if adjustErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": adjustErr.Error()})
		return
	}

	level, err := h.inventoryService.GetInventoryLevelForItem(c, itemID, warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, level)
}

// AllocateInventory handles inventory allocation
func (h *Handler) AllocateInventory(c *gin.Context) {
	var req struct {
		ItemID      string `json:"item_id" binding:"required"`
		WarehouseID string `json:"warehouse_id" binding:"required"`
		Quantity    int64  `json:"quantity" binding:"required"`
		OrderID     string `json:"order_id" binding:"required"`
		UserID      string `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	itemID, err := uuid.Parse(req.ItemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID format"})
		return
	}

	warehouseID, err := uuid.Parse(req.WarehouseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}

	err = h.inventoryService.AllocateInventory(c, itemID, req.Quantity, req.OrderID, warehouseID, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	level, err := h.inventoryService.GetInventoryLevelForItem(c, itemID, warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, level)
}

// ReleaseInventory handles inventory release
func (h *Handler) ReleaseInventory(c *gin.Context) {
	var req struct {
		ItemID      string `json:"item_id" binding:"required"`
		WarehouseID string `json:"warehouse_id" binding:"required"`
		Quantity    int64  `json:"quantity" binding:"required"`
		OrderID     string `json:"order_id" binding:"required"`
		UserID      string `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	itemID, err := uuid.Parse(req.ItemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID format"})
		return
	}

	warehouseID, err := uuid.Parse(req.WarehouseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}

	err = h.inventoryService.ReleaseInventory(c, itemID, req.Quantity, req.OrderID, warehouseID, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	level, err := h.inventoryService.GetInventoryLevelForItem(c, itemID, warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, level)
}

// GetInventoryReport handles inventory report generation
func (h *Handler) GetInventoryReport(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	filters := make(map[string]interface{})
	if itemID := c.Query("item_id"); itemID != "" {
		if id, err := uuid.Parse(itemID); err == nil {
			filters["item_id"] = id
		}
	}
	if warehouseID := c.Query("warehouse_id"); warehouseID != "" {
		if id, err := uuid.Parse(warehouseID); err == nil {
			filters["warehouse_id"] = id
		}
	}
	if transactionType := c.Query("type"); transactionType != "" {
		filters["type"] = transactionType
	}
	if reference := c.Query("reference"); reference != "" {
		filters["reference"] = reference
	}
	if userID := c.Query("user_id"); userID != "" {
		filters["user_id"] = userID
	}

	transactions, total, err := h.inventoryService.GetInventoryTransactions(c, filters, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
	})
}

// Helper function to get current time in ISO 8601 format
func nowISO8601() string {
	return time.Now().Format(time.RFC3339)
} 