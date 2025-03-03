use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::entities::OrderItem;

#[derive(Debug, Serialize, Deserialize, Validate, Clone)]
pub struct CreateOrderItemDto {
    #[validate(length(min = 1, message = "Product ID is required"))]
    pub product_id: String,

    #[validate(length(min = 1, message = "SKU is required"))]
    pub sku: String,

    #[validate(length(
        min = 1,
        max = 255,
        message = "Name is required and must be less than 255 characters"
    ))]
    pub name: String,

    #[validate(range(min = 1, message = "Quantity must be at least 1"))]
    pub quantity: i32,

    #[validate(range(min = 0.01, message = "Unit price must be greater than 0"))]
    pub unit_price: f64,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateOrderItemDto {
    #[validate(range(min = 1, message = "Quantity must be at least 1"))]
    pub quantity: Option<i32>,

    #[validate(range(min = 0.01, message = "Unit price must be greater than 0"))]
    pub unit_price: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderItemDto {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: String,
    pub total_price: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<OrderItem> for OrderItemDto {
    fn from(item: OrderItem) -> Self {
        Self {
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price.to_string(),
            total_price: item.total_price.to_string(),
            created_at: item.created_at,
            updated_at: item.updated_at,
        }
    }
}
