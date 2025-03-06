use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use crate::api::utils::{parse_uuid, success, PaginationParams};
use crate::api::SharedState;
use crate::errors::LogisticsError;
use crate::models::inventory::{
    CreateInventoryItemDto, CreateReservationDto, ReservationStatus, UpdateInventoryItemDto,
    UpdateReservationDto,
};

pub async fn list_inventory_items(
    pagination: Query<PaginationParams>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let items = state
        .inventory_service
        .get_all_items(pagination.page, pagination.limit)
        .await?;

    Ok((StatusCode::OK, success(items)))
}

pub async fn get_inventory_item(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let item = state.inventory_service.get_item_by_id(id).await?;

    Ok((StatusCode::OK, success(item)))
}

pub async fn create_inventory_item(
    State(state): State<SharedState>,
    Json(payload): Json<CreateInventoryItemDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let item = state.inventory_service.create_item(payload).await?;

    Ok((StatusCode::CREATED, success(item)))
}

pub async fn update_inventory_item(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdateInventoryItemDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let item = state.inventory_service.update_item(id, payload).await?;

    Ok((StatusCode::OK, success(item)))
}

pub async fn delete_inventory_item(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let result = state.inventory_service.delete_item(id).await?;

    Ok((
        StatusCode::OK,
        success(serde_json::json!({ "deleted": result })),
    ))
}

pub async fn adjust_quantity(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;

    let quantity = payload
        .get("quantity")
        .and_then(|q| q.as_i64())
        .map(|q| q as i32)
        .ok_or_else(|| {
            LogisticsError::ValidationError(
                "Quantity is required and must be an integer".to_string(),
            )
        })?;

    let item = state
        .inventory_service
        .adjust_quantity(id, quantity)
        .await?;

    Ok((StatusCode::OK, success(item)))
}

pub async fn list_reservations(
    pagination: Query<PaginationParams>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let reservations = state
        .inventory_service
        .get_all_reservations(pagination.page, pagination.limit)
        .await?;

    Ok((StatusCode::OK, success(reservations)))
}

pub async fn get_reservation(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let reservation = state.inventory_service.get_reservation_by_id(id).await?;

    Ok((StatusCode::OK, success(reservation)))
}

pub async fn create_reservation(
    State(state): State<SharedState>,
    Json(payload): Json<CreateReservationDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let reservation = state.inventory_service.create_reservation(payload).await?;

    Ok((StatusCode::CREATED, success(reservation)))
}

pub async fn update_reservation(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdateReservationDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let reservation = state
        .inventory_service
        .update_reservation(id, payload)
        .await?;

    Ok((StatusCode::OK, success(reservation)))
}

pub async fn delete_reservation(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let result = state.inventory_service.delete_reservation(id).await?;

    Ok((
        StatusCode::OK,
        success(serde_json::json!({ "deleted": result })),
    ))
}

pub async fn update_reservation_status(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;

    let status_value = payload
        .get("status")
        .and_then(|s| s.as_str())
        .ok_or_else(|| LogisticsError::ValidationError("Status is required".to_string()))?;

    let status = ReservationStatus::from(status_value.to_string());
    let reservation = state
        .inventory_service
        .update_reservation_status(id, status)
        .await?;

    Ok((StatusCode::OK, success(reservation)))
}
