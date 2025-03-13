package models

import (
	"errors"
	"github.com/google/uuid"
)

// Inventory allocation errors
var (
	ErrInventoryNotFound     = errors.New("inventory not found")
	ErrInsufficientInventory = errors.New("insufficient inventory available")
	ErrReservationNotFound   = errors.New("reservation not found")
)

// InventoryAllocation represents a request to allocate inventory
type InventoryAllocation struct {
	ItemID      uuid.UUID `json:"item_id"`
	WarehouseID uuid.UUID `json:"warehouse_id"`
	OrderID     string    `json:"order_id"`
	Quantity    int64     `json:"quantity"`
} 