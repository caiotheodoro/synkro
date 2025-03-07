use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use crate::api::utils::{parse_uuid, success, PaginationParams};
use crate::api::SharedState;
use crate::errors::LogisticsError;
use crate::models::warehouse::{CreateWarehouseDto, UpdateWarehouseDto};

pub async fn list_warehouses(
    pagination: Query<PaginationParams>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let warehouses = state
        .warehouse_service
        .get_all_warehouses(pagination.page, pagination.limit, pagination.search.clone())
        .await?;

    Ok((StatusCode::OK, success(warehouses)))
}

pub async fn get_warehouse(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let warehouse = state.warehouse_service.get_warehouse_by_id(id).await?;

    Ok((StatusCode::OK, success(warehouse)))
}

pub async fn create_warehouse(
    State(state): State<SharedState>,
    Json(payload): Json<CreateWarehouseDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let warehouse = state.warehouse_service.create_warehouse(payload).await?;

    Ok((StatusCode::CREATED, success(warehouse)))
}

pub async fn update_warehouse(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdateWarehouseDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let warehouse = state
        .warehouse_service
        .update_warehouse(id, payload)
        .await?;

    Ok((StatusCode::OK, success(warehouse)))
}

pub async fn delete_warehouse(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let result = state.warehouse_service.delete_warehouse(id).await?;

    Ok((
        StatusCode::OK,
        success(serde_json::json!({ "deleted": result })),
    ))
}
