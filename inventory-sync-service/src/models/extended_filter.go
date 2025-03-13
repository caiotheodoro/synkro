package models

// ItemFilterExtended contains additional filter options for item queries
type ItemFilterExtended struct {
	SortBy   string
	SortDesc bool
	Limit    int
	Offset   int
}

// InventoryFilterExtended contains additional filter options for inventory queries
type InventoryFilterExtended struct {
	LowStockOnly bool
	Limit        int
	Offset       int
} 