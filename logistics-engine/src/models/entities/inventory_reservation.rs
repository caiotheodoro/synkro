use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum ReservationStatus {
    Pending,
    Confirmed,
    Cancelled,
    Failed,
}

impl ToString for ReservationStatus {
    fn to_string(&self) -> String {
        match self {
            ReservationStatus::Pending => "pending".to_string(),
            ReservationStatus::Confirmed => "confirmed".to_string(),
            ReservationStatus::Cancelled => "cancelled".to_string(),
            ReservationStatus::Failed => "failed".to_string(),
        }
    }
}

impl From<String> for ReservationStatus {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "pending" => ReservationStatus::Pending,
            "confirmed" => ReservationStatus::Confirmed,
            "cancelled" => ReservationStatus::Cancelled,
            "failed" => ReservationStatus::Failed,
            _ => ReservationStatus::Pending,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct InventoryReservation {
    pub id: Uuid,
    pub order_id: Uuid,
    pub reservation_id: String,
    pub warehouse_id: Option<String>,
    pub status: String, // Stored as string in DB
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl InventoryReservation {
    pub fn new(order_id: Uuid, reservation_id: String, warehouse_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            order_id,
            reservation_id,
            warehouse_id,
            status: ReservationStatus::Pending.to_string(),
            created_at: now,
            updated_at: now,
        }
    }

    pub fn reservation_status(&self) -> ReservationStatus {
        ReservationStatus::from(self.status.clone())
    }

    pub fn mark_as_confirmed(&mut self) {
        self.status = ReservationStatus::Confirmed.to_string();
        self.updated_at = Utc::now();
    }

    pub fn mark_as_cancelled(&mut self) {
        self.status = ReservationStatus::Cancelled.to_string();
        self.updated_at = Utc::now();
    }

    pub fn mark_as_failed(&mut self) {
        self.status = ReservationStatus::Failed.to_string();
        self.updated_at = Utc::now();
    }

    pub fn is_confirmed(&self) -> bool {
        self.reservation_status() == ReservationStatus::Confirmed
    }
}
