use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::signal;
use tracing::{error, info, Level};
use tracing_subscriber::FmtSubscriber;

mod api;
mod config;
mod db;
mod error;
mod errors;
mod grpc;
mod models;
mod mq;
mod services;

// Define the proto module here for the binary
pub mod proto {
    pub mod inventory {
        tonic::include_proto!("inventory");
    }

    pub mod order {
        tonic::include_proto!("order");
    }
}

use config::get as get_config;
use services::{
    CustomerService, InventoryService, OrderService, PaymentService, ShippingService,
    WarehouseService,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize configuration
    config::init();
    let config = get_config();

    // Setup logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(match config.tracing.log_level.as_str() {
            "trace" => Level::TRACE,
            "debug" => Level::DEBUG,
            "info" => Level::INFO,
            "warn" => Level::WARN,
            "error" => Level::ERROR,
            _ => Level::INFO,
        })
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    info!("Starting Logistics Engine API");
    info!("Environment: {}", config.tracing.environment);

    // Setup database connection pool
    let database_url = &config.database.url;
    info!("Connecting to database: {}", database_url);

    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .min_connections(config.database.min_connections)
        .acquire_timeout(std::time::Duration::from_secs(
            config.database.connect_timeout_seconds,
        ))
        .idle_timeout(std::time::Duration::from_secs(
            config.database.idle_timeout_seconds,
        ))
        .max_lifetime(std::time::Duration::from_secs(
            config.database.max_lifetime_seconds,
        ))
        .connect(database_url)
        .await?;

    info!("Database connection established");

    // Initialize repositories
    let customer_repo = Arc::new(db::repository::CustomerRepository::new(pool.clone()));
    let warehouse_repo = Arc::new(db::repository::WarehouseRepository::new(pool.clone()));
    let inventory_repo = Arc::new(db::repository::InventoryRepository::new(pool.clone()));
    let order_repo = Arc::new(db::repository::OrderRepository::new(pool.clone()));
    let order_item_repo = Arc::new(db::repository::OrderItemRepository::new(pool.clone()));
    let payment_repo = Arc::new(db::repository::PaymentRepository::new(pool.clone()));
    let shipping_repo = Arc::new(db::repository::ShippingRepository::new(pool.clone()));

    // Initialize services
    let customer_service = Arc::new(CustomerService::new(customer_repo.clone()));
    let warehouse_service = Arc::new(WarehouseService::new(warehouse_repo.clone()));
    let inventory_service = Arc::new(InventoryService::new(inventory_repo.clone()));
    let order_service = Arc::new(OrderService::new(
        order_repo.clone(),
        order_item_repo.clone(),
    ));
    let payment_service = Arc::new(PaymentService::new(payment_repo.clone()));
    let shipping_service = Arc::new(ShippingService::new(shipping_repo.clone()));

    // Create shared application state
    let app_state = api::AppState {
        customer_service,
        warehouse_service,
        inventory_service,
        order_service,
        payment_service,
        shipping_service,
    };

    // Initialize gRPC clients
    grpc::init_grpc_clients().await?;

    // Initialize RabbitMQ connection
    mq::init_rabbitmq().await?;

    // Setup API router
    let app = api::create_router(Arc::new(app_state.clone())).await;

    // Start the gRPC server
    let grpc_app_state = Arc::new(app_state.clone());
    tokio::spawn(async move {
        if let Err(e) = start_grpc_server(grpc_app_state).await {
            error!("gRPC server error: {}", e);
        }
    });

    // Start the HTTP server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));
    info!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("Server shutdown complete");
    Ok(())
}

async fn start_grpc_server(
    app_state: Arc<api::AppState>,
) -> Result<(), Box<dyn std::error::Error>> {
    let config = get_config();
    let addr = format!("{}:{}", config.grpc.host, config.grpc.port).parse()?;

    let order_grpc_service = grpc::order::OrderGrpcService::new(app_state.order_service.clone());

    info!("Starting gRPC server on {}", addr);

    tonic::transport::Server::builder()
        .add_service(order_grpc_service.into_service())
        .serve(addr)
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            info!("Received Ctrl+C signal, starting graceful shutdown");
        },
        _ = terminate => {
            info!("Received terminate signal, starting graceful shutdown");
        },
    }
}
