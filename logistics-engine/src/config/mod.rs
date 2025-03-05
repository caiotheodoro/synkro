use dotenv::dotenv;
use std::env;
use std::sync::OnceLock;

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
    pub request_timeout_seconds: u64,
    pub graceful_shutdown_seconds: u64,
}

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub timeout_seconds: u64,
    pub connect_timeout_seconds: u64,
    pub idle_timeout_seconds: u64,
    pub max_lifetime_seconds: u64,
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
    pub cors_allowed_origins: Vec<String>,
    pub pagination_default_limit: u32,
    pub pagination_max_limit: u32,
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
        request_timeout_seconds: env::var("REQUEST_TIMEOUT_SECONDS")
            .unwrap_or_else(|_| "30".to_string())
            .parse::<u64>()
            .unwrap_or(30),
        graceful_shutdown_seconds: env::var("GRACEFUL_SHUTDOWN_SECONDS")
            .unwrap_or_else(|_| "10".to_string())
            .parse::<u64>()
            .unwrap_or(10),
    };

    let database_config = DatabaseConfig {
        url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
        max_connections: env::var("DB_MAX_CONNECTIONS")
            .unwrap_or_else(|_| "10".to_string())
            .parse::<u32>()
            .unwrap_or(10),
        min_connections: env::var("DB_MIN_CONNECTIONS")
            .unwrap_or_else(|_| "1".to_string())
            .parse::<u32>()
            .unwrap_or(1),
        timeout_seconds: env::var("DB_TIMEOUT_SECONDS")
            .unwrap_or_else(|_| "30".to_string())
            .parse::<u64>()
            .unwrap_or(30),
        connect_timeout_seconds: env::var("DATABASE_CONNECT_TIMEOUT_SECONDS")
            .unwrap_or_else(|_| "30".to_string())
            .parse::<u64>()
            .unwrap_or(30),
        idle_timeout_seconds: env::var("DATABASE_IDLE_TIMEOUT_SECONDS")
            .unwrap_or_else(|_| "600".to_string())
            .parse::<u64>()
            .unwrap_or(600),
        max_lifetime_seconds: env::var("DATABASE_MAX_LIFETIME_SECONDS")
            .unwrap_or_else(|_| "1800".to_string())
            .parse::<u64>()
            .unwrap_or(1800),
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

    let cors_origins = env::var("CORS_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "*".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .collect::<Vec<String>>();

    let pagination_default = env::var("PAGINATION_DEFAULT_LIMIT")
        .unwrap_or_else(|_| "50".to_string())
        .parse::<u32>()
        .unwrap_or(50);

    let pagination_max = env::var("PAGINATION_MAX_LIMIT")
        .unwrap_or_else(|_| "100".to_string())
        .parse::<u32>()
        .unwrap_or(100);

    let tracing_config = TracingConfig {
        environment: env::var("TRACING_ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
        log_level: env::var("TRACING_LOG_LEVEL").unwrap_or_else(|_| "debug".to_string()),
        log_format: env::var("TRACING_LOG_FORMAT").unwrap_or_else(|_| "plain".to_string()),
        cors_allowed_origins: cors_origins,
        pagination_default_limit: pagination_default,
        pagination_max_limit: pagination_max,
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
