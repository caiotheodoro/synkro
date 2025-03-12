use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgHasArrayType, FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[sqlx(type_name = "reservation_status", rename_all = "lowercase")]
pub enum ReservationStatus {
    Pending,
    Confirmed,
    Rejected,
    Released,
}

impl ToString for ReservationStatus {
    fn to_string(&self) -> String {
        match self {
            ReservationStatus::Pending => "pending".to_string(),
            ReservationStatus::Confirmed => "confirmed".to_string(),
            ReservationStatus::Rejected => "rejected".to_string(),
            ReservationStatus::Released => "released".to_string(),
        }
    }
}

impl From<String> for ReservationStatus {
    fn from(status: String) -> Self {
        match status.to_lowercase().as_str() {
            "pending" => ReservationStatus::Pending,
            "confirmed" => ReservationStatus::Confirmed,
            "rejected" => ReservationStatus::Rejected,
            "released" => ReservationStatus::Released,
            _ => ReservationStatus::Pending,
        }
    }
}

impl Default for ReservationStatus {
    fn default() -> Self {
        Self::Pending
    }
}

// Implement PgHasArrayType to use this enum in arrays with PostgreSQL
impl PgHasArrayType for ReservationStatus {
    fn array_type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("_reservation_status")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InventoryReservation {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: String,
    pub sku: String,
    pub quantity: i32,
    pub status: String,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl InventoryReservation {
    pub fn get_status(&self) -> ReservationStatus {
        ReservationStatus::from(self.status.clone())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReservationDto {
    pub order_id: Uuid,
    pub product_id: String,
    pub sku: String,
    pub quantity: i32,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateReservationDto {
    pub status: Option<ReservationStatus>,
    pub quantity: Option<i32>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InventoryItem {
    pub id: Uuid,
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub warehouse_id: Uuid,
    pub warehouse_name: String,
    pub quantity: i32,
    pub price: rust_decimal::Decimal,
    pub attributes: Option<serde_json::Value>,
    pub category: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInventoryItemDto {
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub warehouse_id: Uuid,
    pub quantity: i32,
    pub price: rust_decimal::Decimal,
    pub attributes: Option<serde_json::Value>,
    pub category: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInventoryItemDto {
    pub sku: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub warehouse_id: Option<Uuid>,
    pub quantity: Option<i32>,
    pub price: Option<rust_decimal::Decimal>,
    pub attributes: Option<serde_json::Value>,
    pub category: Option<String>,
}
