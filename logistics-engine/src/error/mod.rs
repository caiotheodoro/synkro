use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal server error: {0}")]
    InternalServerError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("RabbitMQ error: {0}")]
    RabbitMQError(String),

    #[error("Inventory service error: {0}")]
    InventoryServiceError(String),

    #[error("gRPC error: {0}")]
    GrpcError(String),

    #[error("Websocket error: {0}")]
    WebSocketError(String),
}

#[derive(Serialize, Deserialize)]
pub struct ErrorResponse {
    pub status: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::NotFound(message) => (StatusCode::NOT_FOUND, message),
            AppError::BadRequest(message) => (StatusCode::BAD_REQUEST, message),
            AppError::Unauthorized(message) => (StatusCode::UNAUTHORIZED, message),
            AppError::Forbidden(message) => (StatusCode::FORBIDDEN, message),
            AppError::Conflict(message) => (StatusCode::CONFLICT, message),
            AppError::ValidationError(message) => (StatusCode::BAD_REQUEST, message),
            AppError::DatabaseError(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Database error: {}", err),
            ),
            AppError::RabbitMQError(message) => (StatusCode::INTERNAL_SERVER_ERROR, message),
            AppError::InventoryServiceError(message) => (StatusCode::BAD_GATEWAY, message),
            AppError::GrpcError(message) => (StatusCode::BAD_GATEWAY, message),
            AppError::WebSocketError(message) => (StatusCode::INTERNAL_SERVER_ERROR, message),
            AppError::InternalServerError(message) => (StatusCode::INTERNAL_SERVER_ERROR, message),
        };

        tracing::error!(%status, %error_message, "Application error");

        let body = Json(ErrorResponse {
            status: status.to_string(),
            message: error_message,
            error_code: Some(format!("ORDER-{}", status.as_u16())),
            details: None,
        });

        (status, body).into_response()
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalServerError(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::InternalServerError(format!("IO error: {}", err))
    }
}

impl From<tonic::Status> for AppError {
    fn from(status: tonic::Status) -> Self {
        AppError::GrpcError(status.message().to_string())
    }
}

impl From<lapin::Error> for AppError {
    fn from(err: lapin::Error) -> Self {
        AppError::RabbitMQError(format!("RabbitMQ error: {}", err))
    }
}

impl From<tokio_tungstenite::tungstenite::Error> for AppError {
    fn from(err: tokio_tungstenite::tungstenite::Error) -> Self {
        AppError::WebSocketError(format!("WebSocket error: {}", err))
    }
} 