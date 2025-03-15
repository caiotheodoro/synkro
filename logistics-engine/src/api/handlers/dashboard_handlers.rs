use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use num_traits::ToPrimitive;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{api::SharedState, errors::LogisticsError, models::entities::order::OrderStatus};

#[derive(Serialize)]
pub struct InventoryOverview {
    total_items: i64,
    low_stock_count: i64,
    overstock_count: i64,
    total_quantity: i64,
    total_value: f64,
}

#[derive(Serialize)]
pub struct OrderStatusCount {
    status: String,
    count: i64,
}

#[derive(Serialize)]
pub struct OrderStatusOverview {
    status_counts: Vec<OrderStatusCount>,
    total_orders: i64,
}

#[derive(Serialize)]
pub struct DashboardOverview {
    inventory: InventoryOverview,
    orders: OrderStatusOverview,
}

#[derive(Deserialize)]
pub struct ActivityQueryParams {
    limit: Option<usize>,
}

#[derive(Serialize)]
pub struct ActivityItem {
    id: String,
    activity_type: String,
    message: String,
    timestamp: DateTime<Utc>,
    severity: String,
    entity_id: Option<String>,
    entity_type: Option<String>,
}

#[derive(Serialize)]
pub struct RecentActivitiesResponse {
    activities: Vec<ActivityItem>,
}

// Threshold for low stock and overstock
const LOW_STOCK_THRESHOLD: i32 = 10;
const OVERSTOCK_THRESHOLD: i32 = 100;

pub async fn get_dashboard_overview(
    State(state): State<SharedState>,
) -> Result<Json<DashboardOverview>, (StatusCode, String)> {
    // Get inventory overview
    let inventory_overview = get_inventory_overview(&state)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Get order status overview
    let order_overview = get_order_status_overview(&state)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(DashboardOverview {
        inventory: inventory_overview,
        orders: order_overview,
    }))
}

async fn get_inventory_overview(state: &SharedState) -> Result<InventoryOverview, LogisticsError> {
    // Get all inventory items from the inventory service
    let items = state.inventory_service.get_all_items(1, 1000, None).await?;

    let total_items = items.len() as i64;
    let mut total_quantity = 0;
    let mut total_value = 0.0;
    let mut low_stock_count = 0;
    let mut overstock_count = 0;

    for item in items {
        total_quantity += item.quantity as i64;
        // Use ToPrimitive trait for converting Decimal to f64
        let price_f64 = item.price.to_f64().unwrap_or(0.0);
        total_value += (price_f64 * item.quantity as f64);

        if item.quantity <= LOW_STOCK_THRESHOLD {
            low_stock_count += 1;
        }

        if item.quantity >= OVERSTOCK_THRESHOLD {
            overstock_count += 1;
        }
    }

    Ok(InventoryOverview {
        total_items,
        low_stock_count,
        overstock_count,
        total_quantity,
        total_value,
    })
}

async fn get_order_status_overview(
    state: &SharedState,
) -> Result<OrderStatusOverview, LogisticsError> {
    // Get total count of orders
    let total_orders = state.order_service.count_orders().await?;

    // Get count for each status
    let mut status_counts = Vec::new();

    // Enumerate all possible order statuses
    let statuses = vec![
        OrderStatus::Pending,
        OrderStatus::Processing,
        OrderStatus::Shipped,
        OrderStatus::Delivered,
        OrderStatus::Cancelled,
        OrderStatus::Returned,
    ];

    for status in statuses {
        let count = state.order_service.count_orders_by_status(status).await?;

        status_counts.push(OrderStatusCount {
            status: status.to_string(),
            count,
        });
    }

    Ok(OrderStatusOverview {
        status_counts,
        total_orders,
    })
}

pub async fn get_inventory_overview_handler(
    State(state): State<SharedState>,
) -> Result<Json<InventoryOverview>, (StatusCode, String)> {
    get_inventory_overview(&state)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

pub async fn get_order_status_overview_handler(
    State(state): State<SharedState>,
) -> Result<Json<OrderStatusOverview>, (StatusCode, String)> {
    get_order_status_overview(&state)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

pub async fn get_recent_activities_handler(
    Query(params): Query<ActivityQueryParams>,
    State(state): State<SharedState>,
) -> Result<Json<RecentActivitiesResponse>, (StatusCode, String)> {
    // For now, return some mock activities until we implement actual activity tracking
    let limit = params.limit.unwrap_or(10).min(50); // Limit to 50 max

    // Create some mock activities based on recent orders and inventory
    let mut activities = Vec::new();

    // Get a few recent orders and create activities based on their status
    if let Ok(recent_orders) = state.order_service.get_all_orders(1, 5, None).await {
        for order in recent_orders {
            let activity_type = match order.status {
                OrderStatus::Pending => "order",
                OrderStatus::Processing => "order",
                OrderStatus::Shipped => "shipment",
                OrderStatus::Delivered => "shipment",
                OrderStatus::Cancelled => "order",
                OrderStatus::Returned => "order",
                OrderStatus::OutOfStock => "order",
            };

            let message = match order.status {
                OrderStatus::Pending => format!("New order #{} received", order.id),
                OrderStatus::Processing => format!("Order #{} being processed", order.id),
                OrderStatus::Shipped => format!("Order #{} has been shipped", order.id),
                OrderStatus::Delivered => format!("Order #{} has been delivered", order.id),
                OrderStatus::Cancelled => format!("Order #{} has been cancelled", order.id),
                OrderStatus::Returned => format!("Order #{} has been returned", order.id),
                OrderStatus::OutOfStock => format!("Order #{} is out of stock", order.id),
            };

            let severity = match order.status {
                OrderStatus::Cancelled => "warning",
                OrderStatus::Returned => "warning",
                OrderStatus::Delivered => "success",
                _ => "info",
            };

            activities.push(ActivityItem {
                id: Uuid::new_v4().to_string(),
                activity_type: activity_type.to_string(),
                message,
                timestamp: order.updated_at,
                severity: severity.to_string(),
                entity_id: Some(order.id.to_string()),
                entity_type: Some("order".to_string()),
            });
        }
    }

    // Get a few low stock items and create alert activities
    if let Ok(inventory_items) = state.inventory_service.get_all_items(1, 1000, None).await {
        for item in inventory_items {
            if item.quantity <= LOW_STOCK_THRESHOLD {
                activities.push(ActivityItem {
                    id: Uuid::new_v4().to_string(),
                    activity_type: "inventory".to_string(),
                    message: format!(
                        "Low stock alert: {} (only {} left)",
                        item.name, item.quantity
                    ),
                    timestamp: item.updated_at,
                    severity: "warning".to_string(),
                    entity_id: Some(item.id.to_string()),
                    entity_type: Some("inventory".to_string()),
                });
            }
        }
    }

    // Sort activities by timestamp (newest first)
    activities.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    // Apply limit
    activities.truncate(limit);

    Ok(Json(RecentActivitiesResponse { activities }))
}
