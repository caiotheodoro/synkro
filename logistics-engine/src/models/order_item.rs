use chrono::{DateTime, Utc};
use sqlx::{types::BigDecimal, FromRow};
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct OrderItem {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: BigDecimal,
    pub total_price: BigDecimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct UpdateOrderItemDto {
    pub quantity: Option<i32>,
}

#[derive(Debug, Clone)]
pub struct CreateOrderItemDto {
    pub product_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: BigDecimal,
}
