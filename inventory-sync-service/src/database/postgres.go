package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/synkro/inventory-sync-service/src/config"
)

// Database represents the database connection
type PostgresDB struct {
	DB     *sqlx.DB
	Config *config.Config
}

// New creates a new database connection
func New(cfg *config.Config) (*PostgresDB, error) {
	db, err := sqlx.Connect("postgres", cfg.GetDatabaseDSN())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(cfg.Database.MaxConns)
	db.SetMaxIdleConns(cfg.Database.MaxConns / 2)
	db.SetConnMaxLifetime(time.Duration(cfg.Database.Timeout) * time.Second)

	return &PostgresDB{
		DB:     db,
		Config: cfg,
	}, nil
}

// Get executes a query that returns a single row
func (d *PostgresDB) Get(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return d.DB.GetContext(ctx, dest, query, args...)
}

// Select executes a query that returns multiple rows
func (d *PostgresDB) Select(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return d.DB.SelectContext(ctx, dest, query, args...)
}

// Exec executes a query that doesn't return rows
func (d *PostgresDB) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	return d.DB.ExecContext(ctx, query, args...)
}

// BeginTx starts a new transaction
func (d *PostgresDB) BeginTx(ctx context.Context) (*sqlx.Tx, error) {
	return d.DB.BeginTxx(ctx, nil)
}

// Ping checks if the database connection is alive
func (d *PostgresDB) Ping() error {
	return d.DB.Ping()
}

// Close closes the database connection
func (d *PostgresDB) Close() error {
	return d.DB.Close()
}

// RunMigrations runs database migrations
func (d *PostgresDB) RunMigrations(ctx context.Context) error {
	log.Println("Running database migrations...")

	// Check if the warehouses table exists
	var warehousesTableExists bool
	err := d.Get(ctx, &warehousesTableExists, `
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = 'warehouses'
		)
	`)
	
	if err != nil {
		return fmt.Errorf("failed to check if warehouses table exists: %w", err)
	}

	// Create additional inventory-related tables if they don't exist
	if !warehousesTableExists {
		return fmt.Errorf("warehouses table does not exist in the database, please ensure logistics-engine migrations have been run")
	}

	// Add customer_id column to warehouses table if it doesn't exist
	_, err = d.Exec(ctx, `
		DO $$ 
		BEGIN 
			IF NOT EXISTS (
				SELECT FROM information_schema.columns 
				WHERE table_schema = 'public' 
				AND table_name = 'warehouses' 
				AND column_name = 'customer_id'
			) THEN 
				ALTER TABLE warehouses ADD COLUMN customer_id UUID;
			END IF;
		END $$;
	`)
	if err != nil {
		return fmt.Errorf("failed to add customer_id column to warehouses table: %w", err)
	}

	// Create items table if it doesn't exist
	_, err = d.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS inventory_items (
			id UUID PRIMARY KEY,
			sku VARCHAR(100) UNIQUE NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			category VARCHAR(100),
			attributes JSONB,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create items table: %w", err)
	}

	// Create inventory_levels table if it doesn't exist
	_, err = d.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS inventory_levels (
			item_id UUID NOT NULL,
			warehouse_id UUID NOT NULL,
			quantity BIGINT NOT NULL DEFAULT 0,
			reserved BIGINT NOT NULL DEFAULT 0,
			available BIGINT NOT NULL DEFAULT 0,
			last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (item_id, warehouse_id),
			FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
			FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create inventory_levels table: %w", err)
	}

	// Create inventory_transactions table if it doesn't exist
	_, err = d.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS inventory_transactions (
			id UUID PRIMARY KEY,
			item_id UUID NOT NULL,
			quantity BIGINT NOT NULL,
			type VARCHAR(20) NOT NULL,
			reference VARCHAR(255),
			warehouse_id UUID NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			user_id VARCHAR(36),
			FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
			FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create inventory_transactions table: %w", err)
	}

	log.Println("Database migrations completed successfully.")
	return nil
} 