use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use super::OrderStatus;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct OrderStatusHistory {
    pub id: Uuid,
    pub order_id: Uuid,
    pub previous_status: Option<OrderStatus>,
    pub new_status: OrderStatus,
    pub status_notes: Option<String>,
    pub changed_by: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl OrderStatusHistory {
    pub fn new(
        order_id: Uuid,
        previous_status: Option<OrderStatus>,
        new_status: OrderStatus,
        status_notes: Option<String>,
        changed_by: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            order_id,
            previous_status,
            new_status,
            status_notes,
            changed_by,
            created_at: Utc::now(),
        }
    }
}
