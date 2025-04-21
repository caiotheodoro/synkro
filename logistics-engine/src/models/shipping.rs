use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgHasArrayType, FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Hash, Type)]
#[sqlx(type_name = "shipping_status", rename_all = "lowercase")]
pub enum ShippingStatus {
    Pending,
    Processing,
    Shipped,
    InTransit,
    OutForDelivery,
    Delivered,
    Failed,
    Returned,
    Cancelled,
}

impl ShippingStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ShippingStatus::Pending => "pending",
            ShippingStatus::Processing => "processing",
            ShippingStatus::Shipped => "shipped",
            ShippingStatus::InTransit => "in_transit",
            ShippingStatus::OutForDelivery => "out_for_delivery",
            ShippingStatus::Delivered => "delivered",
            ShippingStatus::Failed => "failed",
            ShippingStatus::Returned => "returned",
            ShippingStatus::Cancelled => "cancelled",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(ShippingStatus::Pending),
            "processing" => Some(ShippingStatus::Processing),
            "shipped" => Some(ShippingStatus::Shipped),
            "in_transit" => Some(ShippingStatus::InTransit),
            "out_for_delivery" => Some(ShippingStatus::OutForDelivery),
            "delivered" => Some(ShippingStatus::Delivered),
            "failed" => Some(ShippingStatus::Failed),
            "returned" => Some(ShippingStatus::Returned),
            "cancelled" => Some(ShippingStatus::Cancelled),
            _ => None,
        }
    }
}

impl Default for ShippingStatus {
    fn default() -> Self {
        ShippingStatus::Pending
    }
}

impl PgHasArrayType for ShippingStatus {
    fn array_type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("_shipping_status")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ShippingInfo {
    pub id: Uuid,
    pub order_id: Uuid,
    pub address_line1: String,
    pub address_line2: Option<String>,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: String,
    pub recipient_name: String,
    pub recipient_phone: Option<String>,
    pub shipping_method: String,
    pub shipping_cost: f64,
    pub status: Option<String>,
    pub carrier: Option<String>,
    pub tracking_number: Option<String>,
    pub expected_delivery: Option<DateTime<Utc>>,
    pub actual_delivery: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateShippingInfoDto {
    pub order_id: Uuid,
    pub address_line1: String,
    pub address_line2: Option<String>,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: String,
    pub recipient_name: String,
    pub recipient_phone: Option<String>,
    pub shipping_method: String,
    pub shipping_cost: f64,
    pub carrier: String,
    pub tracking_number: String,
    pub expected_delivery: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateShippingInfoDto {
    pub order_id: Option<Uuid>,
    pub address_line1: Option<String>,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub recipient_name: Option<String>,
    pub recipient_phone: Option<String>,
    pub shipping_method: Option<String>,
    pub shipping_cost: Option<f64>,
    pub carrier: Option<String>,
    pub tracking_number: Option<String>,
    pub expected_delivery: Option<DateTime<Utc>>,
    pub actual_delivery: Option<DateTime<Utc>>,
}
