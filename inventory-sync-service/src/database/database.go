package database

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"
)

// Database represents the interface for database operations
type Database interface {
	// Query execution
	Get(ctx context.Context, dest interface{}, query string, args ...interface{}) error
	Select(ctx context.Context, dest interface{}, query string, args ...interface{}) error
	Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	
	// Transaction management
	BeginTx(ctx context.Context) (*sqlx.Tx, error)
	
	// Connection management
	Ping() error
	Close() error
} 