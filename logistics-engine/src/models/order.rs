use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgHasArrayType, types::BigDecimal, FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq, PartialOrd, Ord)]
#[sqlx(type_name = "order_status", rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
    Returned,
}

impl Default for OrderStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl PgHasArrayType for OrderStatus {
    fn array_type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("_order_status")
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct Order {
    pub id: Uuid,
    pub customer_id: Uuid,
    pub status: OrderStatus,
    pub total_amount: BigDecimal,
    pub currency: String,
    pub tracking_number: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateOrderDto {
    pub customer_id: Uuid,
    pub total_amount: BigDecimal,
    pub currency: Option<String>,
    pub tracking_number: Option<String>,
    pub notes: Option<String>,
    pub items: Vec<CreateOrderItemDto>,
}

#[derive(Debug, Clone)]
pub struct UpdateOrderDto {
    pub status: Option<OrderStatus>,
    pub tracking_number: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CreateOrderItemDto {
    pub product_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: BigDecimal,
}
