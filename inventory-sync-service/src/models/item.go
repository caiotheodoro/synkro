package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type JSONMap map[string]interface{}

type Item struct {
	ID          string    `json:"id" db:"id"`
	SKU         string    `json:"sku" db:"sku"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Category    string    `json:"category" db:"category"`
	Attributes  JSONMap   `json:"attributes" db:"attributes"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

func NewItem(sku, name, description, category string, attributes JSONMap) *Item {
	now := time.Now()
	return &Item{
		ID:          uuid.New().String(),
		SKU:         sku,
		Name:        name,
		Description: description,
		Category:    category,
		Attributes:  attributes,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

func (a *JSONMap) Scan(src interface{}) error {
	switch src := src.(type) {
	case string:
		return json.Unmarshal([]byte(src), &a)
	case []byte:
		return json.Unmarshal(src, &a)
	case nil:
		*a = make(JSONMap)
		return nil
	}
	return nil
}

type CreateItemDTO struct {
	SKU         string  `json:"sku" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Attributes  JSONMap `json:"attributes"`
}

type UpdateItemDTO struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Attributes  JSONMap `json:"attributes"`
} 