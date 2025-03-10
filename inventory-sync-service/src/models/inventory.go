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

type Warehouse struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Code        string    `json:"code" db:"code"`
	Name        string    `json:"name" db:"name"`
	AddressLine1 string   `json:"address_line1" db:"address_line1"`
	AddressLine2 string   `json:"address_line2" db:"address_line2"`
	City        string    `json:"city" db:"city"`
	State       string    `json:"state" db:"state"`
	PostalCode  string    `json:"postal_code" db:"postal_code"`
	Country     string    `json:"country" db:"country"`
	ContactName string    `json:"contact_name" db:"contact_name"`
	ContactPhone string   `json:"contact_phone" db:"contact_phone"`
	ContactEmail string   `json:"contact_email" db:"contact_email"`
	Active      bool      `json:"active" db:"active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	CustomerID  uuid.UUID `json:"customer_id" db:"customer_id"`
}

func NewWarehouse(code, name, addressLine1 string, city, state, postalCode, country string, customerID uuid.UUID) *Warehouse {
	now := time.Now()
	return &Warehouse{
		ID:          uuid.New(),
		Code:        code,
		Name:        name,
		AddressLine1: addressLine1,
		City:        city,
		State:       state,
		PostalCode:  postalCode,
		Country:     country,
		Active:      true,
		CreatedAt:   now,
		CustomerID:  customerID,
	}
}

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