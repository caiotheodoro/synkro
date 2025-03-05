use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgHasArrayType, FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PaymentStatus {
    Pending,
    Processing,
    Succeeded,
    Failed,
    Refunded,
    PartiallyRefunded,
    Cancelled,
}

impl PaymentStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            PaymentStatus::Pending => "pending",
            PaymentStatus::Processing => "processing",
            PaymentStatus::Succeeded => "succeeded",
            PaymentStatus::Failed => "failed",
            PaymentStatus::Refunded => "refunded",
            PaymentStatus::PartiallyRefunded => "partially_refunded",
            PaymentStatus::Cancelled => "cancelled",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(PaymentStatus::Pending),
            "processing" => Some(PaymentStatus::Processing),
            "succeeded" => Some(PaymentStatus::Succeeded),
            "failed" => Some(PaymentStatus::Failed),
            "refunded" => Some(PaymentStatus::Refunded),
            "partially_refunded" => Some(PaymentStatus::PartiallyRefunded),
            "cancelled" => Some(PaymentStatus::Cancelled),
            _ => None,
        }
    }
}

impl Default for PaymentStatus {
    fn default() -> Self {
        PaymentStatus::Pending
    }
}

impl std::fmt::Display for PaymentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PaymentStatus::Pending => write!(f, "pending"),
            PaymentStatus::Processing => write!(f, "processing"),
            PaymentStatus::Succeeded => write!(f, "succeeded"),
            PaymentStatus::Failed => write!(f, "failed"),
            PaymentStatus::Refunded => write!(f, "refunded"),
            PaymentStatus::PartiallyRefunded => write!(f, "partially_refunded"),
            PaymentStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

// Implement PgHasArrayType to use this enum in arrays with PostgreSQL
impl PgHasArrayType for PaymentStatus {
    fn array_type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("_payment_status")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PaymentInfo {
    pub id: Uuid,
    pub order_id: Uuid,
    pub payment_method: String,
    pub transaction_id: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub status: PaymentStatus,
    pub payment_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePaymentInfoDto {
    pub order_id: Uuid,
    pub payment_method: String,
    pub transaction_id: Option<String>,
    pub amount: f64,
    pub currency: Option<String>,
    pub payment_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePaymentInfoDto {
    pub payment_method: Option<String>,
    pub transaction_id: Option<String>,
    pub status: Option<PaymentStatus>,
    pub payment_date: Option<DateTime<Utc>>,
}
