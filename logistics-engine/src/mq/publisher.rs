use crate::config::get as get_config;
use crate::error::AppError;
use crate::mq::events::{Event, EventType};
use chrono::Utc;
use deadpool_lapin::{Manager, Pool, PoolError};
use lapin::{
    options::{BasicPublishOptions, ExchangeDeclareOptions},
    BasicProperties, ConnectionProperties, ExchangeKind,
};
use serde::Serialize;
use std::sync::OnceLock;
use tokio::sync::Mutex;
use tracing::{error, info};
use uuid::Uuid;

static RABBITMQ_POOL: OnceLock<Mutex<Pool>> = OnceLock::new();

pub async fn init_rabbitmq_pool() -> Result<(), AppError> {
    let config = get_config();
    let manager = Manager::new(config.rabbitmq.url.clone(), ConnectionProperties::default());
    let pool = Pool::builder(manager)
        .max_size(10)
        .build()
        .map_err(|e| AppError::RabbitMQError(format!("Failed to create RabbitMQ pool: {}", e)))?;

    // Initialize the pool
    let _ = RABBITMQ_POOL.get_or_init(|| Mutex::new(pool));

    // Test the connection
    let conn = get_rabbitmq_connection().await?;
    let channel = conn
        .create_channel()
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to create channel: {}", e)))?;

    // Declare exchanges
    let config = get_config();
    channel
        .exchange_declare(
            &config.rabbitmq.order_exchange,
            ExchangeKind::Topic,
            ExchangeDeclareOptions {
                durable: true,
                ..Default::default()
            },
            Default::default(),
        )
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to declare exchange: {}", e)))?;

    info!("RabbitMQ connection established and exchange declared");

    Ok(())
}

async fn get_rabbitmq_connection() -> Result<deadpool_lapin::Object, AppError> {
    let pool = match RABBITMQ_POOL.get() {
        Some(pool) => pool,
        None => {
            return Err(AppError::InternalServerError(
                "RabbitMQ pool not initialized".to_string(),
            ))
        }
    };

    let guard = pool.lock().await;
    guard
        .get()
        .await
        .map_err(|e: PoolError| AppError::RabbitMQError(format!("Failed to get connection: {}", e)))
}

pub async fn publish_event<T: Serialize>(
    event_type: EventType,
    routing_key: &str,
    data: T,
) -> Result<(), AppError> {
    let event = Event {
        id: Uuid::new_v4(),
        event_type,
        timestamp: Utc::now(),
        version: "1.0".to_string(),
        data,
    };

    let json = serde_json::to_string(&event)
        .map_err(|e| AppError::InternalServerError(format!("JSON serialization error: {}", e)))?;

    let conn = get_rabbitmq_connection().await?;
    let channel = conn
        .create_channel()
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to create channel: {}", e)))?;

    let config = get_config();

    info!(
        "Publishing event to exchange {} with routing key {}",
        config.rabbitmq.order_exchange, routing_key
    );

    channel
        .basic_publish(
            &config.rabbitmq.order_exchange,
            routing_key,
            BasicPublishOptions::default(),
            json.as_bytes(),
            BasicProperties::default()
                .with_delivery_mode(2) // persistent
                .with_content_type("application/json".into()),
        )
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to publish message: {}", e)))?;

    Ok(())
}
