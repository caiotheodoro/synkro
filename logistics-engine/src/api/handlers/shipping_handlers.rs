use crate::api::utils::{parse_uuid, success, PaginationParams};
use crate::api::SharedState;
use crate::errors::LogisticsError;
use crate::models::dto::shipping::{CreateShippingInfoDto, UpdateShippingInfoDto};
use crate::models::shipping::ShippingStatus;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

pub async fn list_shipments(
    pagination: Query<PaginationParams>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let shipments = state
        .shipping_service
        .get_all_shipments(pagination.limit.into(), pagination.offset.into())
        .await?;

    Ok((StatusCode::OK, success(shipments)))
}

pub async fn get_shipment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let shipment = state.shipping_service.get_shipment_by_id(&id).await?;

    Ok((StatusCode::OK, success(shipment)))
}

pub async fn get_shipment_by_tracking(
    Path(tracking_number): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let shipment = state
        .shipping_service
        .get_shipment_by_tracking(&tracking_number)
        .await?;

    Ok((StatusCode::OK, success(shipment)))
}

pub async fn create_shipment(
    State(state): State<SharedState>,
    Json(payload): Json<CreateShippingInfoDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let shipment = state.shipping_service.create_shipment(payload).await?;

    Ok((StatusCode::CREATED, success(shipment)))
}

pub async fn update_shipment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdateShippingInfoDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let shipment = state.shipping_service.update_shipment(&id, payload).await?;

    Ok((StatusCode::OK, success(shipment)))
}

pub async fn update_shipment_status(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;

    let status = payload
        .get("status")
        .and_then(|s| s.as_str())
        .ok_or_else(|| {
            LogisticsError::ValidationError("Status is required and must be a string".to_string())
        })?;

    let status = ShippingStatus::from_str(status)
        .ok_or_else(|| LogisticsError::ValidationError(format!("Invalid status: {}", status)))?;

    let shipment = state
        .shipping_service
        .update_shipment_status(&id, status)
        .await?;

    Ok((StatusCode::OK, success(shipment)))
}

pub async fn mark_as_delivered(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let shipment = state.shipping_service.mark_as_delivered(&id).await?;

    Ok((StatusCode::OK, success(shipment)))
}

pub async fn delete_shipment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    state.shipping_service.delete_shipment(&id).await?;

    Ok((
        StatusCode::OK,
        success(serde_json::json!({ "deleted": true })),
    ))
}
