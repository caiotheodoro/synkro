use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use crate::api::{
    utils::{parse_uuid, success, PaginationParams},
    SharedState,
};
use crate::errors::LogisticsError;
use crate::models::dto::customer::{CreateCustomerDto, UpdateCustomerDto};

// GET /api/customers
pub async fn list_customers(
    pagination: Query<PaginationParams>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let customers = state
        .customer_service
        .get_all_customers(pagination.page, pagination.limit)
        .await?;

    println!(
        "pagination params: page={}, limit={}",
        pagination.page, pagination.limit
    );
    println!("customers: {:?}", customers);

    Ok(success(customers))
}

// GET /api/customers/:id
pub async fn get_customer(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let uuid = parse_uuid(&id)?;

    let customer = state.customer_service.get_customer_by_id(uuid).await?;

    Ok(success(customer))
}

// POST /api/customers
pub async fn create_customer(
    State(state): State<SharedState>,
    Json(payload): Json<CreateCustomerDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let customer = state.customer_service.create_customer(payload).await?;

    Ok((StatusCode::CREATED, success(customer)))
}

// PUT /api/customers/:id
pub async fn update_customer(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdateCustomerDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let uuid = parse_uuid(&id)?;

    let customer = state
        .customer_service
        .update_customer(uuid, payload)
        .await?;

    Ok(success(customer))
}

// DELETE /api/customers/:id
pub async fn delete_customer(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let uuid = parse_uuid(&id)?;

    let deleted = state.customer_service.delete_customer(uuid).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(LogisticsError::InternalError(
            "Failed to delete customer".to_string(),
        ))
    }
}
