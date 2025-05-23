use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::models::shipping::ShippingStatus;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
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
    pub shipping_cost: rust_decimal::Decimal,
    pub tracking_number: Option<String>,
    pub carrier: Option<String>,
    pub status: String,
    pub expected_delivery: Option<DateTime<Utc>>,
    pub actual_delivery: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl ShippingInfo {
    pub fn new(
        order_id: Uuid,
        address_line1: String,
        address_line2: Option<String>,
        city: String,
        state: String,
        postal_code: String,
        country: String,
        recipient_name: String,
        recipient_phone: Option<String>,
        shipping_method: String,
        shipping_cost: rust_decimal::Decimal,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            order_id,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            recipient_name,
            recipient_phone,
            shipping_method,
            shipping_cost,
            tracking_number: None,
            carrier: None,
            status: ShippingStatus::Pending.as_str().to_string(),
            expected_delivery: None,
            actual_delivery: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn status(&self) -> ShippingStatus {
        ShippingStatus::from_str(&self.status).unwrap_or_default()
    }

    pub fn set_status(&mut self, status: ShippingStatus) {
        self.status = status.as_str().to_string();
        self.updated_at = Utc::now();
    }

    pub fn formatted_address(&self) -> String {
        let line2 = match &self.address_line2 {
            Some(line) if !line.is_empty() => format!("{}\n", line),
            _ => "".to_string(),
        };

        format!(
            "{}\n{}{}, {} {}\n{}",
            self.address_line1, line2, self.city, self.state, self.postal_code, self.country
        )
    }

    pub fn update_shipping_method(&mut self, method: String, cost: rust_decimal::Decimal) {
        self.shipping_method = method;
        self.shipping_cost = cost;
        self.updated_at = Utc::now();
    }

    pub fn add_tracking_info(&mut self, tracking_number: String, carrier: String) {
        self.tracking_number = Some(tracking_number);
        self.carrier = Some(carrier);
        self.set_status(ShippingStatus::Shipped);
    }

    pub fn mark_as_delivered(&mut self) {
        self.set_status(ShippingStatus::Delivered);
    }
}
