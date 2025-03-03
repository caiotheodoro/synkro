use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "payment_status", rename_all = "lowercase")]
pub enum PaymentStatus {
    Pending,
    Paid,
    Failed,
    Refunded,
}

impl ToString for PaymentStatus {
    fn to_string(&self) -> String {
        match self {
            PaymentStatus::Pending => "pending".to_string(),
            PaymentStatus::Paid => "paid".to_string(),
            PaymentStatus::Failed => "failed".to_string(),
            PaymentStatus::Refunded => "refunded".to_string(),
        }
    }
}

impl From<String> for PaymentStatus {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "pending" => PaymentStatus::Pending,
            "paid" => PaymentStatus::Paid,
            "failed" => PaymentStatus::Failed,
            "refunded" => PaymentStatus::Refunded,
            _ => PaymentStatus::Pending,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PaymentInfo {
    pub id: Uuid,
    pub order_id: Uuid,
    pub payment_method: String,
    pub transaction_id: Option<String>,
    pub amount: rust_decimal::Decimal,
    pub currency: String,
    pub status: PaymentStatus,
    pub payment_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl PaymentInfo {
    pub fn new(
        order_id: Uuid,
        payment_method: String,
        amount: rust_decimal::Decimal,
        currency: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            order_id,
            payment_method,
            transaction_id: None,
            amount,
            currency,
            status: PaymentStatus::Pending,
            payment_date: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn mark_as_paid(&mut self, transaction_id: String) {
        self.status = PaymentStatus::Paid;
        self.transaction_id = Some(transaction_id);
        self.payment_date = Some(Utc::now());
        self.updated_at = Utc::now();
    }

    pub fn mark_as_failed(&mut self) {
        self.status = PaymentStatus::Failed;
        self.updated_at = Utc::now();
    }

    pub fn mark_as_refunded(&mut self) {
        self.status = PaymentStatus::Refunded;
        self.updated_at = Utc::now();
    }

    pub fn is_paid(&self) -> bool {
        self.status == PaymentStatus::Paid
    }
}
