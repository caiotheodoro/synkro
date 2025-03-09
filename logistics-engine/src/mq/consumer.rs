use crate::config::get as get_config;
use crate::error::AppError;
use crate::mq::events::{Event, EventType};
use deadpool_lapin::Pool;
use futures_lite::StreamExt;
use lapin::{
    options::{
        BasicAckOptions, BasicConsumeOptions, ExchangeDeclareOptions, QueueBindOptions,
        QueueDeclareOptions,
    },
    types::FieldTable,
    ExchangeKind,
};
use serde::de::DeserializeOwned;
use std::sync::Arc;
use tokio::task::JoinHandle;
use tracing::{error, info, warn};
use uuid::Uuid;

pub struct RabbitMQConsumer {
    pool: Arc<Pool>,
    handlers: Vec<JoinHandle<()>>,
}

impl RabbitMQConsumer {
    pub async fn new(pool: Arc<Pool>) -> Self {
        Self {
            pool,
            handlers: Vec::new(),
        }
    }

    pub async fn register_handler<T, F>(
        &mut self,
        queue_name: &str,
        exchange_name: &str,
        routing_key: &str,
        handler: F,
    ) -> Result<(), AppError>
    where
        T: DeserializeOwned + Send + 'static,
        F: Fn(Event<T>) -> futures::future::BoxFuture<'static, Result<(), AppError>>
            + Send
            + Sync
            + 'static,
    {
        let conn = self
            .pool
            .get()
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to get connection: {}", e)))?;

        let channel = conn
            .create_channel()
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to create channel: {}", e)))?;

        info!(
            "Setting up RabbitMQ consumer for queue {} with routing key {}",
            queue_name, routing_key
        );

        // Declare exchange
        channel
            .exchange_declare(
                exchange_name,
                ExchangeKind::Topic,
                ExchangeDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                Default::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to declare exchange: {}", e)))?;

        // Declare queue
        channel
            .queue_declare(
                queue_name,
                QueueDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                Default::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to declare queue: {}", e)))?;

        // Bind queue to exchange
        channel
            .queue_bind(
                queue_name,
                exchange_name,
                routing_key,
                QueueBindOptions::default(),
                FieldTable::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to bind queue: {}", e)))?;

        // Start consumer
        let consumer = channel
            .basic_consume(
                queue_name,
                &format!("consumer-{}", Uuid::new_v4()),
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await
            .map_err(|e| AppError::RabbitMQError(format!("Failed to start consumer: {}", e)))?;

        let handler = Arc::new(handler);
        let queue_name_clone = queue_name.to_string();

        let handle = tokio::spawn(async move {
            let mut consumer = consumer;

            info!("Started RabbitMQ consumer for queue {}", queue_name_clone);

            while let Some(delivery) = consumer.next().await {
                if let Ok(delivery) = delivery {
                    match serde_json::from_slice::<Event<T>>(&delivery.data) {
                        Ok(event) => {
                            let handler_clone = handler.clone();
                            match handler_clone(event).await {
                                Ok(_) => {
                                    // Acknowledge successful processing
                                    if let Err(e) = delivery.ack(BasicAckOptions::default()).await {
                                        error!("Failed to acknowledge message: {}", e);
                                    }
                                }
                                Err(e) => {
                                    error!("Error processing message: {}", e);
                                    // TODO: Implement dead-letter queue or retry mechanism
                                    // For now, acknowledge the message to avoid blocking the queue
                                    if let Err(e) = delivery.ack(BasicAckOptions::default()).await {
                                        error!("Failed to acknowledge message after processing error: {}", e);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            error!("Error deserializing message: {}", e);
                            // Acknowledge malformed messages to avoid blocking the queue
                            if let Err(e) = delivery.ack(BasicAckOptions::default()).await {
                                error!("Failed to acknowledge malformed message: {}", e);
                            }
                        }
                    }
                } else {
                    warn!("Failed to get delivery from RabbitMQ");
                }
            }

            info!(
                "RabbitMQ consumer for queue {} has stopped",
                queue_name_clone
            );
        });

        self.handlers.push(handle);
        Ok(())
    }

    pub async fn shutdown(self) {
        info!("Shutting down RabbitMQ consumers");
        for handle in self.handlers {
            handle.abort();
        }
    }
}
