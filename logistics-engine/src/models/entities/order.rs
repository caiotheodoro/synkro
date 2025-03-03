use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "order_status", rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
    Returned,
}

impl ToString for OrderStatus {
    fn to_string(&self) -> String {
        match self {
            OrderStatus::Pending => "pending".to_string(),
            OrderStatus::Processing => "processing".to_string(),
            OrderStatus::Shipped => "shipped".to_string(),
            OrderStatus::Delivered => "delivered".to_string(),
            OrderStatus::Cancelled => "cancelled".to_string(),
            OrderStatus::Returned => "returned".to_string(),
        }
    }
}

impl From<String> for OrderStatus {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "pending" => OrderStatus::Pending,
            "processing" => OrderStatus::Processing,
            "shipped" => OrderStatus::Shipped,
            "delivered" => OrderStatus::Delivered,
            "cancelled" => OrderStatus::Cancelled,
            "returned" => OrderStatus::Returned,
            _ => OrderStatus::Pending,
        }
    }
}

impl From<i32> for OrderStatus {
    fn from(value: i32) -> Self {
        match value {
            1 => OrderStatus::Pending,
            2 => OrderStatus::Processing,
            3 => OrderStatus::Shipped,
            4 => OrderStatus::Delivered,
            5 => OrderStatus::Cancelled,
            6 => OrderStatus::Returned,
            _ => OrderStatus::Pending,
        }
    }
}

impl From<OrderStatus> for i32 {
    fn from(status: OrderStatus) -> Self {
        match status {
            OrderStatus::Pending => 1,
            OrderStatus::Processing => 2,
            OrderStatus::Shipped => 3,
            OrderStatus::Delivered => 4,
            OrderStatus::Cancelled => 5,
            OrderStatus::Returned => 6,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Order {
    pub id: Uuid,
    pub customer_id: Uuid,
    pub status: OrderStatus,
    pub total_amount: rust_decimal::Decimal,
    pub currency: String,
    pub tracking_number: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Order {
    pub fn new(
        customer_id: Uuid,
        total_amount: rust_decimal::Decimal,
        currency: String,
        notes: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            customer_id,
            status: OrderStatus::Pending,
            total_amount,
            currency,
            tracking_number: None,
            notes,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn with_tracking_number(mut self, tracking_number: String) -> Self {
        self.tracking_number = Some(tracking_number);
        self
    }

    pub fn update_status(&mut self, new_status: OrderStatus) {
        self.status = new_status;
        self.updated_at = Utc::now();
    }
}
