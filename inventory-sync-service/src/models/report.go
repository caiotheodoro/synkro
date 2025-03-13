package models

import (
	"time"

	"github.com/google/uuid"
)

// InventoryReport represents a report of inventory status
type InventoryReport struct {
	GeneratedAt time.Time            `json:"generated_at"`
	WarehouseID *uuid.UUID           `json:"warehouse_id,omitempty"`
	Category    string               `json:"category,omitempty"`
	FromDate    time.Time            `json:"from_date"`
	ToDate      time.Time            `json:"to_date"`
	Items       []InventoryReportItem `json:"items"`
	Summary     InventoryReportSummary `json:"summary"`
}

// InventoryReportItem represents a single item in an inventory report
type InventoryReportItem struct {
	ItemID       uuid.UUID `json:"item_id"`
	SKU          string    `json:"sku"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`
	Quantity     int64     `json:"quantity"`
	Reserved     int64     `json:"reserved"`
	Available    int64     `json:"available"`
	ReorderLevel int64     `json:"reorder_level,omitempty"`
	IsLowStock   bool      `json:"is_low_stock"`
	LastUpdated  time.Time `json:"last_updated"`
}

// InventoryReportSummary contains summary statistics for the report
type InventoryReportSummary struct {
	TotalItems       int   `json:"total_items"`
	TotalQuantity    int64 `json:"total_quantity"`
	TotalReserved    int64 `json:"total_reserved"`
	TotalAvailable   int64 `json:"total_available"`
	LowStockItems    int   `json:"low_stock_items"`
	OutOfStockItems  int   `json:"out_of_stock_items"`
} 