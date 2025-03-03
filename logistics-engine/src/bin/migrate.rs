use std::error::Error;

use dotenv::dotenv;
use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Load environment variables
    dotenv().ok();

    // Initialize the database connection pool
    let pool = create_pool().await?;

    // Run migrations
    println!("Running database migrations...");
    run_migrations(&pool).await?;
    println!("Migrations completed successfully!");

    Ok(())
}

async fn create_pool() -> Result<PgPool, sqlx::Error> {
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set in the environment");

    PgPool::connect(&database_url).await
}

async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!().run(pool).await
}
