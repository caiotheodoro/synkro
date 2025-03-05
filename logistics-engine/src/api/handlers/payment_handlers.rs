use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use crate::api::utils::{parse_uuid, success, PaginationParams};
use crate::api::SharedState;
use crate::errors::LogisticsError;
use crate::models::dto::payment::{CreatePaymentInfoDto, UpdatePaymentInfoDto};

pub async fn list_payments(
    pagination: Query<PaginationParams>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let payments = state
        .payment_service
        .get_all_payments(pagination.limit.into(), pagination.offset.into())
        .await?;

    Ok((StatusCode::OK, success(payments)))
}

pub async fn get_payment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let payment = state.payment_service.get_payment_by_id(&id).await?;

    match payment {
        Some(p) => Ok((StatusCode::OK, success(p))),
        None => Err(LogisticsError::NotFound("Payment", id.to_string())),
    }
}

pub async fn create_payment(
    State(state): State<SharedState>,
    Json(payload): Json<CreatePaymentInfoDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let payment = state.payment_service.create_payment(payload).await?;

    Ok((StatusCode::CREATED, success(payment)))
}

pub async fn update_payment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdatePaymentInfoDto>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let payment = state.payment_service.update_payment(&id, payload).await?;

    Ok((StatusCode::OK, success(payment)))
}

pub async fn process_payment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let payment = state.payment_service.process_payment(&id, None).await?;

    Ok((StatusCode::OK, success(payment)))
}

pub async fn refund_payment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    let payment = state.payment_service.refund_payment(&id).await?;

    Ok((StatusCode::OK, success(payment)))
}

pub async fn delete_payment(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, LogisticsError> {
    let id = parse_uuid(&id)?;
    state.payment_service.delete_payment(&id).await?;

    Ok((
        StatusCode::OK,
        success(serde_json::json!({ "deleted": true })),
    ))
}
