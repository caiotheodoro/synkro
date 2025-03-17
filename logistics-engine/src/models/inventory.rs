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

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[sqlx(type_name = "transaction_type", rename_all = "lowercase")]
pub enum TransactionType {
    Add,
    Remove,
    Allocate,
    Release,
}

impl ToString for TransactionType {
    fn to_string(&self) -> String {
        match self {
            TransactionType::Add => "add".to_string(),
            TransactionType::Remove => "remove".to_string(),
            TransactionType::Allocate => "allocate".to_string(),
            TransactionType::Release => "release".to_string(),
        }
    }
}

impl From<String> for TransactionType {
    fn from(status: String) -> Self {
        match status.to_lowercase().as_str() {
            "add" => TransactionType::Add,
            "remove" => TransactionType::Remove,
            "allocate" => TransactionType::Allocate,
            "release" => TransactionType::Release,
            _ => TransactionType::Add,
        }
    }
}

// Implement PgHasArrayType to use this enum in arrays with PostgreSQL
impl PgHasArrayType for TransactionType {
    fn array_type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("_transaction_type")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InventoryReservation {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: Uuid,
    pub product_name: Option<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InventoryTransaction {
    pub id: Uuid,
    pub item_id: Uuid,
    pub item_name: Option<String>,
    pub item_sku: Option<String>,
    pub warehouse_id: Uuid,
    pub warehouse_name: Option<String>,
    pub quantity: i32,
    pub transaction_type: String,
    pub reference: Option<String>,
    pub user_id: Option<String>,
    pub timestamp: DateTime<Utc>,
}

impl InventoryTransaction {
    pub fn get_transaction_type(&self) -> TransactionType {
        TransactionType::from(self.transaction_type.clone())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReservationDto {
    pub order_id: Uuid,
    pub product_id: Uuid,
    pub sku: String,
    pub quantity: i32,
    #[serde(deserialize_with = "deserialize_optional_date")]
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateReservationDto {
    pub status: Option<ReservationStatus>,
    pub quantity: Option<i32>,
    #[serde(deserialize_with = "deserialize_optional_date")]
    pub expires_at: Option<DateTime<Utc>>,
}

// Custom deserializer for dates that can handle both date-only strings and full ISO datetime strings
fn deserialize_optional_date<'de, D>(deserializer: D) -> Result<Option<DateTime<Utc>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let opt = Option::<String>::deserialize(deserializer)?;

    match opt {
        None => Ok(None),
        Some(date_str) => {
            // Try parsing as a full ISO datetime
            if let Ok(dt) = DateTime::parse_from_rfc3339(&date_str) {
                return Ok(Some(dt.with_timezone(&Utc)));
            }

            // Try parsing as a date-only string (YYYY-MM-DD)
            if let Ok(naive_date) = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d") {
                // Convert to datetime at midnight UTC
                let naive_datetime = naive_date.and_hms_opt(0, 0, 0).unwrap();
                return Ok(Some(DateTime::<Utc>::from_naive_utc_and_offset(
                    naive_datetime,
                    Utc,
                )));
            }

            // If both parsing attempts failed, return an error
            Err(serde::de::Error::custom(format!(
                "Expected ISO date or datetime string, got: {}",
                date_str
            )))
        }
    }
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
    pub low_stock_threshold: Option<i32>,
    pub overstock_threshold: Option<i32>,
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
    pub low_stock_threshold: Option<i32>,
    pub overstock_threshold: Option<i32>,
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
    pub low_stock_threshold: Option<i32>,
    pub overstock_threshold: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTransactionDto {
    pub item_id: Uuid,
    pub warehouse_id: Uuid,
    pub quantity: i32,
    pub transaction_type: String,
    pub reference: Option<String>,
    pub user_id: Option<String>,
}
