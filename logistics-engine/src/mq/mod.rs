pub mod connection;
pub mod consumer;
pub mod dlq;
pub mod events;
pub mod publisher;

use crate::error::AppError;

pub async fn init_rabbitmq() -> Result<(), AppError> {
    // Initialize RabbitMQ connections and exchanges
    publisher::init_rabbitmq_pool().await
}
