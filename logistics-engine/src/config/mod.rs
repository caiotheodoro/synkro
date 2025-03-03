use dotenv::dotenv;
use serde::Deserialize;
use std::env;
use std::sync::OnceLock;
use std::time::Duration;

static CONFIG: OnceLock<AppConfig> = OnceLock::new();

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub rabbitmq: RabbitMQConfig,
    pub grpc: GrpcConfig,
    pub tracing: TracingConfig,
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub env: String,
}

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub timeout_seconds: u64,
}

#[derive(Debug, Clone)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub jwt_expiration: u64,
}

#[derive(Debug, Clone)]
pub struct RabbitMQConfig {
    pub url: String,
    pub order_exchange: String,
    pub order_queue: String,
    pub retry_attempts: u32,
}

#[derive(Debug, Clone)]
pub struct GrpcConfig {
    pub host: String,
    pub port: u16,
    pub inventory_url: String,
}

#[derive(Debug, Clone)]
pub struct TracingConfig {
    pub environment: String,
    pub log_level: String,
    pub log_format: String,
}

pub fn init() {
    dotenv().ok();

    let server_config = ServerConfig {
        host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
        port: env::var("SERVER_PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .unwrap_or(8080),
        env: env::var("NODE_ENV").unwrap_or_else(|_| "development".to_string()),
    };

    let database_config = DatabaseConfig {
        url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
        max_connections: env::var("DB_MAX_CONNECTIONS")
            .unwrap_or_else(|_| "10".to_string())
            .parse::<u32>()
            .unwrap_or(10),
        timeout_seconds: env::var("DB_TIMEOUT_SECONDS")
            .unwrap_or_else(|_| "30".to_string())
            .parse::<u64>()
            .unwrap_or(30),
    };

    let auth_config = AuthConfig {
        jwt_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
        jwt_expiration: env::var("JWT_EXPIRATION")
            .unwrap_or_else(|_| "86400".to_string())
            .parse::<u64>()
            .unwrap_or(86400),
    };

    let rabbitmq_config = RabbitMQConfig {
        url: env::var("RABBITMQ_URL").expect("RABBITMQ_URL must be set"),
        order_exchange: env::var("RABBITMQ_ORDER_EXCHANGE")
            .unwrap_or_else(|_| "order_events".to_string()),
        order_queue: env::var("RABBITMQ_ORDER_QUEUE")
            .unwrap_or_else(|_| "order_processing".to_string()),
        retry_attempts: env::var("RABBITMQ_RETRY_ATTEMPTS")
            .unwrap_or_else(|_| "3".to_string())
            .parse::<u32>()
            .unwrap_or(3),
    };

    let grpc_config = GrpcConfig {
        host: env::var("GRPC_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
        port: env::var("GRPC_PORT")
            .unwrap_or_else(|_| "50051".to_string())
            .parse::<u16>()
            .unwrap_or(50051),
        inventory_url: env::var("INVENTORY_SERVICE_URL")
            .unwrap_or_else(|_| "http://localhost:50052".to_string()),
    };

    let tracing_config = TracingConfig {
        environment: env::var("TRACING_ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
        log_level: env::var("TRACING_LOG_LEVEL").unwrap_or_else(|_| "debug".to_string()),
        log_format: env::var("TRACING_LOG_FORMAT").unwrap_or_else(|_| "plain".to_string()),
    };

    let app_config = AppConfig {
        server: server_config,
        database: database_config,
        auth: auth_config,
        rabbitmq: rabbitmq_config,
        grpc: grpc_config,
        tracing: tracing_config,
    };

    CONFIG.set(app_config).expect("Failed to set app config");
}

pub fn get() -> &'static AppConfig {
    CONFIG.get_or_init(|| {
        init();
        CONFIG.get().expect("Config not initialized").clone()
    })
}
