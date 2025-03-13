package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
	"github.com/synkro/inventory-sync-service/src/repository"
)

type itemRepository struct {
	db *sqlx.DB
}

func NewItemRepository(db *sqlx.DB) repository.ItemRepository {
	return &itemRepository{db: db}
}

func (r *itemRepository) GetDB() *sqlx.DB {
	return r.db
}

func (r *itemRepository) CreateItem(ctx context.Context, item *models.Item) error {
	attributes, err := json.Marshal(item.Attributes)
	if err != nil {
		return fmt.Errorf("failed to marshal attributes: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO inventory_items (id, sku, name, description, category, attributes, warehouse_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, item.ID, item.SKU, item.Name, item.Description, item.Category, attributes, item.WarehouseID, item.CreatedAt, item.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create item: %w", err)
	}

	return nil
}

func (r *itemRepository) GetItem(ctx context.Context, id string) (*models.Item, error) {
	var item models.Item
	var attributesBlob []byte

	err := r.db.QueryRowxContext(ctx, `
		SELECT id, sku, name, description, category, attributes, created_at, updated_at
		FROM inventory_items
		WHERE id = $1
	`, id).Scan(
		&item.ID,
		&item.SKU,
		&item.Name,
		&item.Description,
		&item.Category,
		&attributesBlob,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("item not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	// Unmarshal attributes JSON
	if attributesBlob != nil {
		var attrs map[string]interface{}
		if err := json.Unmarshal(attributesBlob, &attrs); err != nil {
			return nil, fmt.Errorf("failed to unmarshal attributes: %w", err)
		}
		item.Attributes = attrs
	}

	return &item, nil
}

func (r *itemRepository) GetItemBySKU(ctx context.Context, sku string) (*models.Item, error) {
	var item models.Item
	var attributesBlob []byte

	err := r.db.QueryRowxContext(ctx, `
		SELECT id, sku, name, description, category, attributes, created_at, updated_at
		FROM inventory_items
		WHERE sku = $1
	`, sku).Scan(
		&item.ID,
		&item.SKU,
		&item.Name,
		&item.Description,
		&item.Category,
		&attributesBlob,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("item not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get item by SKU: %w", err)
	}

	// Unmarshal attributes JSON
	if attributesBlob != nil {
		var attrs map[string]interface{}
		if err := json.Unmarshal(attributesBlob, &attrs); err != nil {
			return nil, fmt.Errorf("failed to unmarshal attributes: %w", err)
		}
		item.Attributes = attrs
	}

	return &item, nil
}

func (r *itemRepository) UpdateItem(ctx context.Context, item *models.Item) error {
	attributes, err := json.Marshal(item.Attributes)
	if err != nil {
		return fmt.Errorf("failed to marshal attributes: %w", err)
	}

	item.UpdatedAt = time.Now()

	result, err := r.db.ExecContext(ctx, `
		UPDATE inventory_items
		SET sku = $1, name = $2, description = $3, category = $4, attributes = $5, updated_at = $6
		WHERE id = $7
	`, item.SKU, item.Name, item.Description, item.Category, attributes, item.UpdatedAt, item.ID)

	if err != nil {
		return fmt.Errorf("failed to update item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("item not found")
	}

	return nil
}

func (r *itemRepository) DeleteItem(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM inventory_items WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("item not found")
	}

	return nil
}

func (r *itemRepository) ListItems(ctx context.Context, filter models.ItemFilter, extended models.ItemFilterExtended) ([]*models.Item, error) {
	queryBuilder := `
		SELECT id, sku, name, description, category, attributes, created_at, updated_at
		FROM inventory_items
		WHERE 1=1
	`
	
	params := []interface{}{}
	paramCount := 1
	
	// Apply filters
	if filter.Category != "" {
		queryBuilder += fmt.Sprintf(" AND category = $%d", paramCount)
		params = append(params, filter.Category)
		paramCount++
	}
	
	if filter.Search != "" {
		queryBuilder += fmt.Sprintf(" AND (name ILIKE $%d OR sku ILIKE $%d OR description ILIKE $%d)", 
			paramCount, paramCount, paramCount)
		searchTerm := "%" + filter.Search + "%"
		params = append(params, searchTerm)
		paramCount++
	}
	
	// Apply sorting
	queryBuilder += " ORDER BY "
	if extended.SortBy != "" {
		// Whitelist allowed sort fields
		allowedFields := map[string]bool{
			"name": true, "sku": true, "category": true, "created_at": true, "updated_at": true,
		}
		
		if allowedFields[extended.SortBy] {
			queryBuilder += extended.SortBy
			
			if extended.SortDesc {
				queryBuilder += " DESC"
			} else {
				queryBuilder += " ASC"
			}
		} else {
			queryBuilder += "created_at DESC"
		}
	} else {
		queryBuilder += "created_at DESC"
	}
	
	// Apply pagination
	if extended.Limit > 0 {
		queryBuilder += fmt.Sprintf(" LIMIT $%d", paramCount)
		params = append(params, extended.Limit)
		paramCount++
		
		if extended.Offset > 0 {
			queryBuilder += fmt.Sprintf(" OFFSET $%d", paramCount)
			params = append(params, extended.Offset)
		}
	}
	
	// Execute the query
	rows, err := r.db.QueryxContext(ctx, queryBuilder, params...)
	if err != nil {
		return nil, fmt.Errorf("failed to list items: %w", err)
	}
	defer rows.Close()
	
	var items []*models.Item
	for rows.Next() {
		var item models.Item
		var attributesBlob []byte
		
		err := rows.Scan(
			&item.ID,
			&item.SKU,
			&item.Name,
			&item.Description,
			&item.Category,
			&attributesBlob,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		
		if err != nil {
			return nil, fmt.Errorf("failed to scan item: %w", err)
		}
		
		// Unmarshal attributes JSON
		if attributesBlob != nil {
			var attrs map[string]interface{}
			if err := json.Unmarshal(attributesBlob, &attrs); err != nil {
				return nil, fmt.Errorf("failed to unmarshal attributes: %w", err)
			}
			item.Attributes = attrs
		}
		
		items = append(items, &item)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over rows: %w", err)
	}
	
	return items, nil
}

func (r *itemRepository) BulkCreateItems(ctx context.Context, items []*models.Item) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	for _, item := range items {
		attributes, err := json.Marshal(item.Attributes)
		if err != nil {
			return fmt.Errorf("failed to marshal attributes for item %s: %w", item.SKU, err)
		}
		
		_, err = tx.ExecContext(ctx, `
			INSERT INTO inventory_items (id, sku, name, description, category, attributes, warehouse_id, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, item.ID, item.SKU, item.Name, item.Description, item.Category, attributes, item.WarehouseID, item.CreatedAt, item.UpdatedAt)
		
		if err != nil {
			return fmt.Errorf("failed to create item %s: %w", item.SKU, err)
		}
	}
	
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return nil
}

func (r *itemRepository) BulkUpdateItems(ctx context.Context, items []*models.Item) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	now := time.Now()
	
	for _, item := range items {
		attributes, err := json.Marshal(item.Attributes)
		if err != nil {
			return fmt.Errorf("failed to marshal attributes for item %s: %w", item.ID, err)
		}
		
		item.UpdatedAt = now
		
		result, err := tx.ExecContext(ctx, `
			UPDATE inventory_items
			SET sku = $1, name = $2, description = $3, category = $4, attributes = $5, updated_at = $6
			WHERE id = $7
		`, item.SKU, item.Name, item.Description, item.Category, attributes, item.UpdatedAt, item.ID)
		
		if err != nil {
			return fmt.Errorf("failed to update item %s: %w", item.ID, err)
		}
		
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected for item %s: %w", item.ID, err)
		}
		
		if rowsAffected == 0 {
			return fmt.Errorf("item %s not found", item.ID)
		}
	}
	
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return nil
}

func (r *itemRepository) BulkDeleteItems(ctx context.Context, ids []string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	
	for _, id := range ids {
		result, err := tx.ExecContext(ctx, "DELETE FROM inventory_items WHERE id = $1", id)
		if err != nil {
			return fmt.Errorf("failed to delete item %s: %w", id, err)
		}
		
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected for item %s: %w", id, err)
		}
		
		if rowsAffected == 0 {
			return fmt.Errorf("item %s not found", id)
		}
	}
	
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return nil
} 