package models

import (
	"time"
)

// CreateItemDTO for item creation
type CreateItemDTO struct {
	SKU         string  `json:"sku" validate:"required"`
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Attributes  JSONMap `json:"attributes"`
}

// UpdateItemDTO for item updates
type UpdateItemDTO struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Attributes  JSONMap `json:"attributes"`
}

// BulkUpdateItem for bulk update operations
type BulkUpdateItem struct {
	ID      string       `json:"id" validate:"required"`
	Updates UpdateItemDTO `json:"updates" validate:"required"`
}

// BulkItemResult for bulk operation results
type BulkItemResult struct {
	ID      string `json:"id"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// ItemFilter for filtering item lists
type ItemFilter struct {
	Page     int    `json:"page" form:"page"`
	PageSize int    `json:"page_size" form:"page_size"`
	Category string `json:"category" form:"category"`
	Search   string `json:"search" form:"search"`
}

// CreateWarehouseDTO for warehouse creation
type CreateWarehouseDTO struct {
	Name        string  `json:"name" validate:"required"`
	Code        string  `json:"code" validate:"required"`
	Description string  `json:"description"`
	Address     Address `json:"address" validate:"required"`
}

// UpdateWarehouseDTO for warehouse updates
type UpdateWarehouseDTO struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Address     Address `json:"address"`
}

// InventoryFilter for filtering inventory lists
type InventoryFilter struct {
	ItemID      string `json:"item_id" form:"item_id"`
	WarehouseID string `json:"warehouse_id" form:"warehouse_id"`
	Page        int    `json:"page" form:"page"`
	PageSize    int    `json:"page_size" form:"page_size"`
}

// ReportFilter for filtering inventory reports
type ReportFilter struct {
	WarehouseID  string    `json:"warehouse_id" form:"warehouse_id"`
	Category     string    `json:"category" form:"category"`
	FromDate     time.Time `json:"from_date" form:"from_date"`
	ToDate       time.Time `json:"to_date" form:"to_date"`
	LowStockOnly bool      `json:"low_stock_only" form:"low_stock_only"`
}

// ProductItem represents an item with quantity for inventory operations
type ProductItem struct {
	ProductID string `json:"product_id"`
	SKU       string `json:"sku"`
	Quantity  int32  `json:"quantity" validate:"required,min=1"`
}

// StockReservationResult represents the result of a stock reservation operation
type StockReservationResult struct {
	Success       bool                    `json:"success"`
	ReservationID string                  `json:"reservation_id"`
	Items         []ProductAvailability   `json:"items"`
	Message       string                  `json:"message"`
}

// ProductAvailability represents the availability of a product
type ProductAvailability struct {
	ProductID         string `json:"product_id"`
	SKU               string `json:"sku"`
	InStock           bool   `json:"in_stock"`
	AvailableQuantity int32  `json:"available_quantity"`
	ErrorMessage      string `json:"error_message,omitempty"`
} 