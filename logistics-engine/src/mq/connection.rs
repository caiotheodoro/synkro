use crate::config::get as get_config;
use crate::error::AppError;
use std::time::Duration;
use tokio::time;
use tokio_executor_trait::Tokio;
use tracing::{info, warn};

pub async fn create_resilient_connection() -> Result<lapin::Connection, AppError> {
    let config = get_config();
    let options = lapin::ConnectionProperties::default()
        .with_connection_name("logistics-engine-connection".into())
        .with_executor(Tokio::current());

    let mut retry_count = 0;
    let max_retries = config.rabbitmq.retry_attempts;

    loop {
        match lapin::Connection::connect(&config.rabbitmq.url, options.clone()).await {
            Ok(conn) => {
                info!("Successfully connected to RabbitMQ");
                return Ok(conn);
            }
            Err(err) => {
                retry_count += 1;
                if retry_count > max_retries {
                    return Err(AppError::RabbitMQError(format!(
                        "Failed to connect to RabbitMQ after {} attempts: {}",
                        max_retries, err
                    )));
                }

                let backoff_seconds = retry_count * 2;
                warn!(
                    "Failed to connect to RabbitMQ (attempt {}/{}), retrying in {} seconds: {}",
                    retry_count, max_retries, backoff_seconds, err
                );

                time::sleep(Duration::from_secs(backoff_seconds.into())).await;
            }
        }
    }
}

pub async fn create_resilient_channel(
    connection: &lapin::Connection,
) -> Result<lapin::Channel, AppError> {
    let mut retry_count = 0;
    let max_retries = get_config().rabbitmq.retry_attempts;

    loop {
        match connection.create_channel().await {
            Ok(channel) => {
                info!("Successfully created RabbitMQ channel");
                return Ok(channel);
            }
            Err(err) => {
                retry_count += 1;
                if retry_count > max_retries {
                    return Err(AppError::RabbitMQError(format!(
                        "Failed to create RabbitMQ channel after {} attempts: {}",
                        max_retries, err
                    )));
                }

                let backoff_seconds = retry_count;
                warn!(
                    "Failed to create RabbitMQ channel (attempt {}/{}), retrying in {} seconds: {}",
                    retry_count, max_retries, backoff_seconds, err
                );

                time::sleep(Duration::from_secs(backoff_seconds.into())).await;
            }
        }
    }
}
