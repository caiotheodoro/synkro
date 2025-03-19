package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/synkro/inventory-sync-service/src/config"
)

type PostgresDB struct {
	DB     *sqlx.DB
	Config *config.Config
}

func New(cfg *config.Config) (*PostgresDB, error) {
	db, err := sqlx.Connect("postgres", cfg.GetDatabaseDSN())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	db.SetMaxOpenConns(cfg.Database.MaxConns)
	db.SetMaxIdleConns(cfg.Database.MaxConns / 2)
	db.SetConnMaxLifetime(time.Duration(cfg.Database.Timeout) * time.Second)

	return &PostgresDB{
		DB:     db,
		Config: cfg,
	}, nil
}

func (d *PostgresDB) Get(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return d.DB.GetContext(ctx, dest, query, args...)
}

func (d *PostgresDB) Select(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return d.DB.SelectContext(ctx, dest, query, args...)
}

func (d *PostgresDB) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	return d.DB.ExecContext(ctx, query, args...)
}

func (d *PostgresDB) BeginTx(ctx context.Context) (*sqlx.Tx, error) {
	return d.DB.BeginTxx(ctx, nil)
}

func (d *PostgresDB) Ping() error {
	return d.DB.Ping()
}

func (d *PostgresDB) Close() error {
	return d.DB.Close()
}

func (d *PostgresDB) RunMigrations(ctx context.Context) error {
	log.Println("Running database migrations...")

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

	if !warehousesTableExists {
		return fmt.Errorf("warehouses table does not exist in the database, please ensure logistics-engine migrations have been run")
	}

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

	_, err = d.Exec(ctx, `
		DROP TABLE IF EXISTS inventory_reservations CASCADE;
		DROP TABLE IF EXISTS inventory_transactions CASCADE;
		DROP TABLE IF EXISTS inventory_levels CASCADE;
		DROP TABLE IF EXISTS inventory_items CASCADE;
	`)
	if err != nil {
		return fmt.Errorf("failed to drop inventory tables: %w", err)
	}

	_, err = d.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS inventory_items (
			id UUID PRIMARY KEY,
			sku VARCHAR(100) UNIQUE NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			category VARCHAR(100),
			attributes JSONB,
			quantity INTEGER,
			overstock_threshold INTEGER,
			low_stock_threshold INTEGER,
			price DECIMAL(10, 2),
			warehouse_id UUID,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create items table: %w", err)
	}

	_, err = d.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS inventory_levels (
			item_id UUID NOT NULL,
			warehouse_id UUID NOT NULL,
			quantity BIGINT NOT NULL DEFAULT 0,
			reserved BIGINT NOT NULL DEFAULT 0,
			available BIGINT NOT NULL DEFAULT 0,
			last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (item_id, warehouse_id),
			FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
			FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create inventory_levels table: %w", err)
	}

	_, err = d.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS inventory_transactions (
			id UUID PRIMARY KEY,
			item_id UUID NOT NULL,
			quantity BIGINT NOT NULL,
			type VARCHAR(20) NOT NULL,
			reference VARCHAR(255),
			warehouse_id UUID NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			user_id VARCHAR(36),
			FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
			FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create inventory_transactions table: %w", err)
	}

	_, err = d.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS inventory_reservations (
			id UUID PRIMARY KEY,
			order_id VARCHAR(255) NOT NULL,
			product_id UUID NOT NULL,
			quantity BIGINT NOT NULL,
			status VARCHAR(20) NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			completed_at TIMESTAMPTZ,
			sku VARCHAR(100) NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create inventory_reservations table: %w", err)
	}

	_, err = d.Exec(ctx, `
		ALTER TABLE IF EXISTS payment_info
		DROP COLUMN IF EXISTS status_enum,
		DROP COLUMN IF EXISTS status_str,
		ADD COLUMN IF NOT EXISTS status VARCHAR(50);
	`)

	if err != nil {
		return fmt.Errorf("failed to alter payment_info table: %w", err)
	}

	_, err = d.Exec(ctx, `
		ALTER TABLE IF EXISTS warehouses
		ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
	`)

	if err != nil {
		return fmt.Errorf("failed to alter warehouses table: %w", err)
	}

	_, err = d.Exec(ctx, `
		ALTER TABLE IF EXISTS shipping_info
		ADD COLUMN IF NOT EXISTS status VARCHAR(50),
		DROP COLUMN IF EXISTS status_str,
		ADD COLUMN IF NOT EXISTS expected_delivery TIMESTAMPTZ,
		ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMPTZ;
	`)

	if err != nil {
		return fmt.Errorf("failed to alter shipping_info table: %w", err)
	}

	log.Println("Database migrations completed successfully.")
	return nil
}