package models

import (
	"time"

	"github.com/google/uuid"
)

type InventoryLevel struct {
	ItemID      uuid.UUID `json:"item_id" db:"item_id"`
	WarehouseID uuid.UUID `json:"warehouse_id" db:"warehouse_id"`
	Quantity    int64     `json:"quantity" db:"quantity"`
	Reserved    int64     `json:"reserved" db:"reserved"`
	Available   int64     `json:"available" db:"available"`
	LastUpdated time.Time `json:"last_updated" db:"last_updated"`
}

type TransactionType string

const (
	TransactionTypeAdd      TransactionType = "add"
	TransactionTypeRemove   TransactionType = "remove"
	TransactionTypeAllocate TransactionType = "allocate"
	TransactionTypeRelease  TransactionType = "release"
)

type InventoryTransaction struct {
	ID          uuid.UUID      `json:"id" db:"id"`
	ItemID      uuid.UUID      `json:"item_id" db:"item_id"`
	Quantity    int64          `json:"quantity" db:"quantity"`
	Type        TransactionType `json:"type" db:"type"`
	Reference   string         `json:"reference" db:"reference"`
	WarehouseID uuid.UUID      `json:"warehouse_id" db:"warehouse_id"`
	Timestamp   time.Time      `json:"timestamp" db:"timestamp"`
	UserID      string         `json:"user_id" db:"user_id"`
}

func NewInventoryTransaction(itemID uuid.UUID, quantity int64, txType TransactionType, reference string, warehouseID uuid.UUID, userID string) *InventoryTransaction {
	return &InventoryTransaction{
		ID:          uuid.New(),
		ItemID:      itemID,
		Quantity:    quantity,
		Type:        txType,
		Reference:   reference,
		WarehouseID: warehouseID,
		Timestamp:   time.Now(),
		UserID:      userID,
	}
}

type InventoryReservation struct {
	ID          string            `db:"id" json:"id"`
	OrderID     string            `db:"order_id" json:"order_id"`
	ProductID   uuid.UUID         `db:"product_id" json:"product_id"`
	Quantity    int64             `db:"quantity" json:"quantity"`
	Status      ReservationStatus `db:"status" json:"status"`
	CreatedAt   time.Time         `db:"created_at" json:"created_at"`
	CompletedAt *time.Time        `db:"completed_at" json:"completed_at,omitempty"`
	SKU         string            `db:"sku" json:"sku"`
	ExpiresAt   time.Time         `db:"expires_at" json:"expires_at"`
}

// ReservationStatus represents the status of an inventory reservation
type ReservationStatus string

const (
	ReservationStatusPending   ReservationStatus = "pending"
	ReservationStatusCommitted ReservationStatus = "committed"
	ReservationStatusCancelled ReservationStatus = "cancelled"
	ReservationStatusExpired   ReservationStatus = "expired"
)

type AdjustInventoryDTO struct {
	ItemID      uuid.UUID `json:"item_id" binding:"required"`
	Quantity    int64     `json:"quantity" binding:"required"`
	Reason      string    `json:"reason"`
	WarehouseID uuid.UUID `json:"warehouse_id" binding:"required"`
	Reference   string    `json:"reference"`
	UserID      string    `json:"user_id"`
}

type AllocateInventoryDTO struct {
	ItemID      uuid.UUID `json:"item_id" binding:"required"`
	Quantity    int64     `json:"quantity" binding:"required"`
	OrderID     string    `json:"order_id" binding:"required"`
	WarehouseID uuid.UUID `json:"warehouse_id" binding:"required"`
	UserID      string    `json:"user_id"`
}

type ReleaseInventoryDTO struct {
	ItemID      uuid.UUID `json:"item_id" binding:"required"`
	Quantity    int64     `json:"quantity" binding:"required"`
	OrderID     string    `json:"order_id" binding:"required"`
	WarehouseID uuid.UUID `json:"warehouse_id" binding:"required"`
	UserID      string    `json:"user_id"`
} 