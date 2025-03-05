use axum::{
    extract::{Path, Query, State},
    Json,
};

use crate::api::utils::{parse_uuid, PaginationParams, SuccessResponse};
use crate::models::entities::order::{Order, OrderStatus};
use crate::models::order_item::OrderItem;
use crate::models::{
    dto::order::{CreateOrderDto, UpdateOrderDto},
    order_item::UpdateOrderItemDto,
};
use crate::{api::SharedState, errors::LogisticsError};
use rust_decimal::Decimal;
use sqlx::types::BigDecimal;
use std::str::FromStr;

pub async fn list_orders(
    pagination: Query<PaginationParams>,
    State(state): State<SharedState>,
) -> Result<Json<SuccessResponse<Vec<Order>>>, LogisticsError> {
    let orders = state
        .order_service
        .get_all_orders(pagination.page, pagination.limit)
        .await?;

    Ok(Json(SuccessResponse {
        success: true,
        data: orders,
    }))
}

pub async fn get_order(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<Json<SuccessResponse<Order>>, LogisticsError> {
    let id = parse_uuid(&id)?;
    let order = state.order_service.get_order_by_id(id).await?;

    Ok(Json(SuccessResponse {
        success: true,
        data: order,
    }))
}

pub async fn create_order(
    State(state): State<SharedState>,
    Json(payload): Json<CreateOrderDto>,
) -> Result<Json<SuccessResponse<Order>>, LogisticsError> {
    let order = state.order_service.create_order(payload).await?;

    Ok(Json(SuccessResponse {
        success: true,
        data: order,
    }))
}

pub async fn update_order(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdateOrderDto>,
) -> Result<Json<SuccessResponse<Order>>, LogisticsError> {
    let id = parse_uuid(&id)?;
    let order = state.order_service.update_order(id, payload).await?;

    Ok(Json(SuccessResponse {
        success: true,
        data: order,
    }))
}

pub async fn update_order_status(
    Path(id): Path<String>,
    State(state): State<SharedState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<SuccessResponse<Order>>, LogisticsError> {
    let id = parse_uuid(&id)?;

    let status_str = payload
        .get("status")
        .and_then(|s| s.as_str())
        .ok_or_else(|| {
            LogisticsError::ValidationError("Status is required and must be a string".to_string())
        })?;

    let status = match status_str {
        "pending" => OrderStatus::Pending,
        "processing" => OrderStatus::Processing,
        "shipped" => OrderStatus::Shipped,
        "delivered" => OrderStatus::Delivered,
        "cancelled" => OrderStatus::Cancelled,
        "returned" => OrderStatus::Returned,
        _ => {
            return Err(LogisticsError::ValidationError(format!(
                "Invalid status: {}. Must be one of: pending, processing, shipped, delivered, cancelled, returned",
                status_str
            )))
        }
    };

    let order = state.order_service.update_order_status(id, status).await?;

    Ok(Json(SuccessResponse {
        success: true,
        data: order,
    }))
}

pub async fn get_order_items(
    Path(id): Path<String>,
    State(state): State<SharedState>,
) -> Result<Json<SuccessResponse<Vec<OrderItem>>>, LogisticsError> {
    let uuid = parse_uuid(&id)?;

    let entity_items = state.order_service.get_order_items(uuid).await?;

    let items = entity_items
        .into_iter()
        .map(|item| OrderItem {
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unit_price: BigDecimal::from(item.unit_price),
            total_price: BigDecimal::from(item.total_price),
            created_at: item.created_at,
            updated_at: item.updated_at,
        })
        .collect();

    Ok(Json(SuccessResponse {
        success: true,
        data: items,
    }))
}

pub async fn update_order_item(
    Path((id, item_id)): Path<(String, String)>,
    State(state): State<SharedState>,
    Json(payload): Json<UpdateOrderItemDto>,
) -> Result<Json<SuccessResponse<OrderItem>>, LogisticsError> {
    let item_id = parse_uuid(&item_id)?;

    let order_item = state
        .order_service
        .update_order_item(item_id, payload.quantity.unwrap())
        .await?;

    Ok(Json(SuccessResponse {
        success: true,
        data: order_item,
    }))
}

// Helper function to convert BigDecimal to Decimal
fn to_decimal(bd: BigDecimal) -> Decimal {
    Decimal::from_str(&bd.to_string()).unwrap_or_default()
}
