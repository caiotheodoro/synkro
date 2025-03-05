use axum::{
    extract::rejection::JsonRejection,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use uuid::Uuid;

use crate::errors::LogisticsError;

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub status: u16,
    pub message: String,
}

impl IntoResponse for LogisticsError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            LogisticsError::NotFound(entity, id) => (
                StatusCode::NOT_FOUND,
                format!("{} with ID {} not found", entity, id),
            ),
            LogisticsError::ValidationError(msg) => (StatusCode::BAD_REQUEST, msg),
            LogisticsError::DatabaseError(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Database error: {}", err),
            ),
            LogisticsError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        let body = Json(ApiError {
            status: status.as_u16(),
            message: error_message,
        });

        (status, body).into_response()
    }
}

pub fn parse_uuid(id: &str) -> Result<Uuid, LogisticsError> {
    Uuid::from_str(id)
        .map_err(|_| LogisticsError::ValidationError(format!("Invalid UUID format: {}", id)))
}

pub fn handle_json_extraction_error(error: JsonRejection) -> (StatusCode, Json<ApiError>) {
    let status = StatusCode::BAD_REQUEST;
    let message = format!("JSON extraction error: {}", error);

    (
        status,
        Json(ApiError {
            status: status.as_u16(),
            message,
        }),
    )
}

// Pagination params for list endpoints
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: u32,
    #[serde(default = "default_limit")]
    pub limit: u32,
    #[serde(default = "default_offset")]
    pub offset: u32,
}

fn default_page() -> u32 {
    1
}

fn default_limit() -> u32 {
    50
}

fn default_offset() -> u32 {
    0
}

// Default success response
#[derive(Debug, Serialize)]
pub struct SuccessResponse<T> {
    pub success: bool,
    pub data: T,
}

pub fn success<T: Serialize>(data: T) -> Json<SuccessResponse<T>> {
    Json(SuccessResponse {
        success: true,
        data,
    })
}

// Convert page (1-based) to offset (0-based)
pub fn page_to_offset(page: u32, limit: u32) -> u32 {
    (page.saturating_sub(1)) * limit
}
