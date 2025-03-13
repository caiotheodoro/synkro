package models

import (
	"time"

	"github.com/google/uuid"
)

// Address represents a physical location address
type Address struct {
	AddressLine1 string `json:"address_line1" db:"address_line1" validate:"required"`
	AddressLine2 string `json:"address_line2" db:"address_line2"`
	City         string `json:"city" db:"city" validate:"required"`
	State        string `json:"state" db:"state" validate:"required"`
	PostalCode   string `json:"postal_code" db:"postal_code" validate:"required"`
	Country      string `json:"country" db:"country" validate:"required"`
}

// Warehouse represents a physical inventory location
type Warehouse struct {
	ID           string    `json:"id" db:"id"`
	Code         string    `json:"code" db:"code"`
	Name         string    `json:"name" db:"name"`
	Address      Address   `json:"address" db:"address"`
	ContactName  string    `json:"contact_name" db:"contact_name"`
	ContactPhone string    `json:"contact_phone" db:"contact_phone"`
	ContactEmail string    `json:"contact_email" db:"contact_email"`
	Active       bool      `json:"active" db:"active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// NewWarehouse creates a new warehouse instance
func NewWarehouse(code, name string, address Address) *Warehouse {
	now := time.Now()
	return &Warehouse{
		ID:          uuid.New().String(),
		Code:        code,
		Name:        name,
		Address:     address,
		Active:      true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
} 