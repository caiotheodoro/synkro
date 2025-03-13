package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/synkro/inventory-sync-service/src/models"
)

type ItemRepository struct {
	db *sqlx.DB
}

func NewItemRepository(db *sqlx.DB) *ItemRepository {
	return &ItemRepository{db: db}
}

func (r *ItemRepository) Create(ctx context.Context, item *models.Item) error {
	attributes, err := json.Marshal(item.Attributes)
	if err != nil {
		return fmt.Errorf("failed to marshal attributes: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO inventory_items (id, sku, name, description, category, attributes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, item.ID, item.SKU, item.Name, item.Description, item.Category, attributes, item.CreatedAt, item.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create item: %w", err)
	}

	return nil
}

func (r *ItemRepository) GetByID(ctx context.Context, id string) (*models.Item, error) {
	var item models.Item
	var attributesJSON []byte

	err := r.db.QueryRowContext(ctx, `
		SELECT id, sku, name, description, category, attributes, created_at, updated_at
		FROM inventory_items
		WHERE id = $1
	`, id).Scan(
		&item.ID,
		&item.SKU,
		&item.Name,
		&item.Description,
		&item.Category,
		&attributesJSON,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("item with id %s not found", id)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	// Unmarshal attributes
	item.Attributes = make(models.JSONMap)
	if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal attributes: %w", err)
	}

	return &item, nil
}

func (r *ItemRepository) GetBySKU(ctx context.Context, sku string) (*models.Item, error) {
	var item models.Item
	var attributesJSON []byte

	err := r.db.QueryRowContext(ctx, `
		SELECT id, sku, name, description, category, attributes, created_at, updated_at
		FROM inventory_items
		WHERE sku = $1
	`, sku).Scan(
		&item.ID,
		&item.SKU,
		&item.Name,
		&item.Description,
		&item.Category,
		&attributesJSON,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("item with sku %s not found", sku)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	// Unmarshal attributes
	item.Attributes = make(models.JSONMap)
	if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal attributes: %w", err)
	}

	return &item, nil
}

func (r *ItemRepository) Update(ctx context.Context, item *models.Item) error {
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
		return fmt.Errorf("item with id %s not found", item.ID)
	}

	return nil
}

func (r *ItemRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `
		DELETE FROM inventory_items
		WHERE id = $1
	`, id)

	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("item with id %s not found", id)
	}

	return nil
}

func (r *ItemRepository) List(ctx context.Context, page, pageSize int, category string) ([]*models.Item, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	// Build query based on whether a category is specified
	query := `
		SELECT id, sku, name, description, category, attributes, created_at, updated_at
		FROM inventory_items
	`
	countQuery := `
		SELECT COUNT(*)
		FROM inventory_items
	`
	
	var args []interface{}
	if category != "" {
		query += " WHERE category = $1"
		countQuery += " WHERE category = $1"
		args = append(args, category)
	}

	query += " ORDER BY name LIMIT $" + fmt.Sprintf("%d", len(args)+1) + " OFFSET $" + fmt.Sprintf("%d", len(args)+2)
	args = append(args, pageSize, offset)

	// Get total count
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args[:len(args)-2]...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count items: %w", err)
	}

	// Execute query
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list items: %w", err)
	}
	defer rows.Close()

	// Process results
	var items []*models.Item
	for rows.Next() {
		var item models.Item
		var attributesJSON []byte

		if err := rows.Scan(
			&item.ID,
			&item.SKU,
			&item.Name,
			&item.Description,
			&item.Category,
			&attributesJSON,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan item: %w", err)
		}

		// Unmarshal attributes
		item.Attributes = make(models.JSONMap)
		if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal attributes: %w", err)
		}

		items = append(items, &item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating rows: %w", err)
	}

	return items, total, nil
}

func (r *ItemRepository) BulkCreate(ctx context.Context, items []*models.Item) (int, []string, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	successCount := 0
	errors := make([]string, 0)

	for _, item := range items {
		attributes, err := json.Marshal(item.Attributes)
		if err != nil {
			errors = append(errors, fmt.Sprintf("failed to marshal attributes for item %s: %v", item.ID, err))
			continue
		}

		_, err = tx.ExecContext(ctx, `
			INSERT INTO inventory_items (id, sku, name, description, category, attributes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (sku) DO NOTHING
		`, item.ID, item.SKU, item.Name, item.Description, item.Category, attributes, item.CreatedAt, item.UpdatedAt)

		if err != nil {
			errors = append(errors, fmt.Sprintf("failed to create item %s: %v", item.ID, err))
			continue
		}

		successCount++
	}

	if err := tx.Commit(); err != nil {
		return 0, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return successCount, errors, nil
}

func (r *ItemRepository) BulkUpdate(ctx context.Context, items []*models.Item) (int, []string, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
			defer tx.Rollback()

	successCount := 0
	errors := make([]string, 0)

	for _, item := range items {
		attributes, err := json.Marshal(item.Attributes)
		if err != nil {
			errors = append(errors, fmt.Sprintf("failed to marshal attributes for item %s: %v", item.ID, err))
			continue
		}

		item.UpdatedAt = time.Now()

		result, err := tx.ExecContext(ctx, `
			UPDATE inventory_items
			SET sku = $1, name = $2, description = $3, category = $4, attributes = $5, updated_at = $6
			WHERE id = $7
		`, item.SKU, item.Name, item.Description, item.Category, attributes, item.UpdatedAt, item.ID)

		if err != nil {
			errors = append(errors, fmt.Sprintf("failed to update item %s: %v", item.ID, err))
			continue
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			errors = append(errors, fmt.Sprintf("failed to get rows affected for item %s: %v", item.ID, err))
			continue
		}

		if rowsAffected == 0 {
			errors = append(errors, fmt.Sprintf("item with id %s not found", item.ID))
			continue
		}

		successCount++
	}

	if err := tx.Commit(); err != nil {
		return 0, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return successCount, errors, nil
} 