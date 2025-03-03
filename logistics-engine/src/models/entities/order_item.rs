use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct OrderItem {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: rust_decimal::Decimal,
    pub total_price: rust_decimal::Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl OrderItem {
    pub fn new(
        order_id: Uuid,
        product_id: String,
        sku: String,
        name: String,
        quantity: i32,
        unit_price: rust_decimal::Decimal,
    ) -> Self {
        let now = Utc::now();
        let total_price = unit_price * rust_decimal::Decimal::from(quantity);

        Self {
            id: Uuid::new_v4(),
            order_id,
            product_id,
            sku,
            name,
            quantity,
            unit_price,
            total_price,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn calculate_total(&self) -> rust_decimal::Decimal {
        self.unit_price * rust_decimal::Decimal::from(self.quantity)
    }

    pub fn update_quantity(&mut self, quantity: i32) {
        self.quantity = quantity;
        self.total_price = self.unit_price * rust_decimal::Decimal::from(quantity);
        self.updated_at = Utc::now();
    }
}
