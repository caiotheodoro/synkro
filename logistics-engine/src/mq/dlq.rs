use crate::error::AppError;
use lapin::{
    options::{ExchangeDeclareOptions, QueueBindOptions, QueueDeclareOptions},
    types::{AMQPValue, FieldTable},
    ExchangeKind,
};
use tracing::info;

pub async fn setup_dead_letter_queue(
    channel: &lapin::Channel,
    queue_name: &str,
    exchange_name: &str,
    routing_key: &str,
) -> Result<(), AppError> {
    // Declare the DLX (Dead Letter Exchange)
    let dlx_name = format!("{}.dlx", exchange_name);
    info!("Declaring dead letter exchange: {}", dlx_name);

    channel
        .exchange_declare(
            &dlx_name,
            ExchangeKind::Topic,
            ExchangeDeclareOptions {
                durable: true,
                ..Default::default()
            },
            Default::default(),
        )
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to declare DLX: {}", e)))?;

    // Declare the DLQ (Dead Letter Queue)
    let dlq_name = format!("{}.dlq", queue_name);
    info!("Declaring dead letter queue: {}", dlq_name);

    channel
        .queue_declare(
            &dlq_name,
            QueueDeclareOptions {
                durable: true,
                ..Default::default()
            },
            Default::default(),
        )
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to declare DLQ: {}", e)))?;

    // Bind the DLQ to the DLX
    info!("Binding DLQ to DLX with routing key: {}", routing_key);
    channel
        .queue_bind(
            &dlq_name,
            &dlx_name,
            routing_key,
            QueueBindOptions::default(),
            FieldTable::default(),
        )
        .await
        .map_err(|e| AppError::RabbitMQError(format!("Failed to bind DLQ: {}", e)))?;

    // Create arguments for the main queue pointing to the DLX
    let mut args = FieldTable::default();
    args.insert(
        "x-dead-letter-exchange".into(),
        AMQPValue::LongString(dlx_name.into()),
    );
    args.insert(
        "x-dead-letter-routing-key".into(),
        AMQPValue::LongString(routing_key.into()),
    );

    // Declare the main queue with DLX configuration
    info!("Redeclaring main queue with DLX config: {}", queue_name);
    channel
        .queue_declare(
            queue_name,
            QueueDeclareOptions {
                durable: true,
                ..Default::default()
            },
            args,
        )
        .await
        .map_err(|e| {
            AppError::RabbitMQError(format!("Failed to declare main queue with DLX: {}", e))
        })?;

    info!("Dead letter queue setup complete for queue: {}", queue_name);

    Ok(())
}
