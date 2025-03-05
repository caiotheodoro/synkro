use crate::models::payment::{PaymentInfo as ModelPaymentInfo, PaymentStatus};
use bigdecimal::ToPrimitive;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PaymentInfo {
    pub id: Uuid,
    pub order_id: Uuid,
    pub payment_method: String,
    pub transaction_id: Option<String>,
    pub amount: Decimal,
    pub currency: String,
    pub status_str: String,
    pub payment_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl PaymentInfo {
    pub fn new(order_id: Uuid, payment_method: String, amount: Decimal, currency: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            order_id,
            payment_method,
            transaction_id: None,
            amount,
            currency,
            status_str: PaymentStatus::Pending.as_str().to_string(),
            payment_date: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn status(&self) -> PaymentStatus {
        PaymentStatus::from_str(&self.status_str).unwrap_or_default()
    }

    pub fn set_status(&mut self, status: PaymentStatus) {
        self.status_str = status.as_str().to_string();
        self.updated_at = Utc::now();
    }

    pub fn mark_as_paid(&mut self, transaction_id: String) {
        self.set_status(PaymentStatus::Succeeded);
        self.transaction_id = Some(transaction_id);
        self.payment_date = Some(Utc::now());
    }

    pub fn mark_as_failed(&mut self) {
        self.set_status(PaymentStatus::Failed);
    }

    pub fn mark_as_refunded(&mut self) {
        self.set_status(PaymentStatus::Refunded);
    }

    pub fn is_paid(&self) -> bool {
        self.status() == PaymentStatus::Succeeded
    }
}

impl From<PaymentInfo> for ModelPaymentInfo {
    fn from(entity: PaymentInfo) -> Self {
        ModelPaymentInfo {
            id: entity.id,
            order_id: entity.order_id,
            payment_method: entity.payment_method.clone(),
            transaction_id: entity.transaction_id.clone(),
            amount: entity.amount.to_f64().unwrap_or_default(),
            currency: entity.currency.clone(),
            status: entity.status(),
            payment_date: entity.payment_date,
            created_at: entity.created_at,
            updated_at: entity.updated_at,
        }
    }
}
