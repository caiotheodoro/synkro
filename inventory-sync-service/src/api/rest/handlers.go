package rest

import (
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
	warehouseService services.WarehouseService
}

func NewHandler(itemService services.ItemService, inventoryService services.InventoryService, warehouseService services.WarehouseService) *Handler {
	return &Handler{
		itemService:      itemService,
		inventoryService: inventoryService,
		warehouseService: warehouseService,
	}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	println("RegisterRoutes called")
	
	router.GET("/health", h.HealthCheck)
	
	api := router.Group("/api/v1")
	{
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

		warehouses := api.Group("/warehouses")
		{
			warehouses.GET("", h.ListWarehouses)
			warehouses.GET("/:id", h.GetWarehouse)
			warehouses.POST("", h.CreateWarehouse)
			warehouses.PUT("/:id", h.UpdateWarehouse)
			warehouses.DELETE("/:id", h.DeleteWarehouse)
		}

		inventory := api.Group("/inventory")
		{
			inventory.POST("/adjust", h.AdjustInventory)
			inventory.POST("/allocate", h.AllocateInventory)
			inventory.POST("/release", h.ReleaseInventory)
			inventory.GET("/levels", h.GetInventoryLevels)
		}

		reports := api.Group("/reports")
		{
			reports.GET("/inventory", h.GetInventoryReport)
		}
	}
	
	println("Routes registered:")
	for _, route := range router.Routes() {
		println(route.Method + " " + route.Path)
	}
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
	})
}

func (h *Handler) CreateItem(c *gin.Context) {
	var dto models.CreateItemDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item := &models.Item{
		SKU:         dto.SKU,
		Name:        dto.Name,
		Description: dto.Description,
		Category:    dto.Category,
		Attributes:  dto.Attributes,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err := h.itemService.CreateItem(c, item)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func (h *Handler) GetItem(c *gin.Context) {
	id := c.Param("id")
	
	item, err := h.itemService.GetItem(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *Handler) UpdateItem(c *gin.Context) {
	id := c.Param("id")
	
	var dto models.UpdateItemDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existingItem, err := h.itemService.GetItem(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if dto.Name != "" {
		existingItem.Name = dto.Name
	}
	if dto.Description != "" {
		existingItem.Description = dto.Description
	}
	if dto.Category != "" {
		existingItem.Category = dto.Category
	}
	if len(dto.Attributes) > 0 {
		if existingItem.Attributes == nil {
			existingItem.Attributes = make(map[string]interface{})
		}
		for k, v := range dto.Attributes {
			existingItem.Attributes[k] = v
		}
	}
	existingItem.UpdatedAt = time.Now()

	err = h.itemService.UpdateItem(c, existingItem)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existingItem)
}

func (h *Handler) DeleteItem(c *gin.Context) {
	id := c.Param("id")
	
	err := h.itemService.DeleteItem(c, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) ListItems(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	category := c.Query("category")
	search := c.Query("search")

	filter := models.ItemFilter{
		Page:     page,
		PageSize: pageSize,
		Category: category,
		Search:   search,
	}

	extendedFilter := models.ItemFilterExtended{}

	items, err := h.itemService.ListItems(c, filter, extendedFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	total := len(items)
	if total == pageSize {
		total = page*pageSize + 1
	} else {
		total = (page-1)*pageSize + total
	}

	c.JSON(http.StatusOK, gin.H{
		"items":     items,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *Handler) BulkCreateItems(c *gin.Context) {
	var dtos []models.CreateItemDTO
	if err := c.ShouldBindJSON(&dtos); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items := make([]*models.Item, len(dtos))
	for i, dto := range dtos {
		items[i] = &models.Item{
			SKU:         dto.SKU,
			Name:        dto.Name,
			Description: dto.Description,
			Category:    dto.Category,
			Attributes:  dto.Attributes,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
	}

	err := h.itemService.BulkCreateItems(c, items)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	successCount := len(items)
	c.JSON(http.StatusOK, gin.H{
		"items":         items,
		"success_count": successCount,
		"failure_count": 0,
		"errors":        []string{},
	})
}

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

func (h *Handler) CreateWarehouse(c *gin.Context) {
	var warehouse models.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New()
	warehouse.ID = id.String()
	warehouse.CreatedAt = time.Now()
	warehouse.UpdatedAt = time.Now()

	if err := h.warehouseService.CreateWarehouse(c, &warehouse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, warehouse)
}

func (h *Handler) GetWarehouse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}
	
	warehouse, err := h.warehouseService.GetWarehouse(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

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

	warehouse.ID = id.String()
	warehouse.UpdatedAt = time.Now()
	
	if err := h.warehouseService.UpdateWarehouse(c, &warehouse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

func (h *Handler) DeleteWarehouse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
		return
	}
	
	if err := h.warehouseService.DeleteWarehouse(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) ListWarehouses(c *gin.Context) {
	warehouses, err := h.warehouseService.ListWarehouses(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, warehouses)
}

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

func (h *Handler) GetInventoryLevels(c *gin.Context) {
	levels, err := h.inventoryService.GetInventoryLevels(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, levels)
}

func (h *Handler) AdjustInventory(c *gin.Context) {
	var req struct {
		ItemID      string `json:"item_id" binding:"required"`
		WarehouseID string `json:"warehouse_id" binding:"required"`
		Quantity    int64  `json:"quantity" binding:"required"`
		Reason      string `json:"reason" binding:"required"`
		Reference   string `json:"reference"`
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

	level, err := h.inventoryService.AdjustInventory(c, itemID, req.Quantity, req.Reason, req.Reference, warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, level)
}

func (h *Handler) AllocateInventory(c *gin.Context) {
	var req struct {
		ItemID        string `json:"item_id" binding:"required"`
		WarehouseID   string `json:"warehouse_id" binding:"required"`
		Quantity      int64  `json:"quantity" binding:"required"`
		ReservationID string `json:"reservation_id" binding:"required"`
		UserID        string `json:"user_id" binding:"required"`
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

	err = h.inventoryService.AllocateInventory(c, itemID, req.Quantity, req.ReservationID, warehouseID, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	level, err := h.inventoryService.GetInventoryLevelForItem(c, itemID, warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Inventory allocated successfully",
		"reservation_id":   req.ReservationID,
		"inventory_level":  level,
	})
}

func (h *Handler) ReleaseInventory(c *gin.Context) {
	var req struct {
		ReservationID string `json:"reservation_id" binding:"required"`
		Reason        string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.inventoryService.ReleaseInventory(c, req.ReservationID, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Inventory reservation released successfully",
		"reservation_id": req.ReservationID,
	})
}

func (h *Handler) GetInventoryReport(c *gin.Context) {
	warehouseIDStr := c.Query("warehouse_id")
	category := c.Query("category")
	lowStockOnly := c.Query("low_stock_only") == "true"
	
	var fromDate, toDate time.Time
	var err error
	
	if fromDateStr := c.Query("from_date"); fromDateStr != "" {
		fromDate, err = time.Parse(time.RFC3339, fromDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from_date format. Use RFC3339 format."})
			return
		}
	}
	
	if toDateStr := c.Query("to_date"); toDateStr != "" {
		toDate, err = time.Parse(time.RFC3339, toDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to_date format. Use RFC3339 format."})
			return
		}
	}
	
	if warehouseIDStr != "" {
		_, err = uuid.Parse(warehouseIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID format"})
			return
		}
	}
	
	filter := models.ReportFilter{
		WarehouseID:  warehouseIDStr,
		Category:     category,
		FromDate:     fromDate,
		ToDate:       toDate,
		LowStockOnly: lowStockOnly,
	}
	report, err := h.inventoryService.GetInventoryReport(c, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, report)
}