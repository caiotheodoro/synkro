use std::env;
use std::time::Duration;

use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Executor;

pub type DbPool = PgPool;

pub async fn create_pool() -> Result<PgPool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let max_connections = env::var("DATABASE_MAX_CONNECTIONS")
        .unwrap_or_else(|_| "5".to_string())
        .parse::<u32>()
        .unwrap_or(5);

    let timeout_seconds = env::var("DATABASE_TIMEOUT_SECONDS")
        .unwrap_or_else(|_| "5".to_string())
        .parse::<u64>()
        .unwrap_or(5);

    tracing::info!("Creating database connection pool");

    let pool = PgPoolOptions::new()
        .max_connections(max_connections)
        .acquire_timeout(Duration::from_secs(timeout_seconds))
        .connect(&database_url)
        .await?;

    tracing::info!("Database connection pool created successfully");

    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    tracing::info!("Running database migrations");

    match sqlx::migrate!("./migrations").run(pool).await {
        Ok(_) => {
            tracing::info!("Database migrations completed successfully");
            Ok(())
        }
        Err(e) => {
            tracing::error!("Failed to run database migrations: {}", e);
            Err(e)
        }
    }
}

pub async fn check_database_connection(pool: &PgPool) -> bool {
    match pool.execute("SELECT 1").await {
        Ok(_) => {
            tracing::info!("Database connection successful");
            true
        }
        Err(e) => {
            tracing::error!("Failed to connect to database: {}", e);
            false
        }
    }
}
