use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::entities::{PaymentInfo, PaymentStatus};

#[derive(Debug, Serialize, Deserialize, Validate, Clone)]
pub struct CreatePaymentInfoDto {
    #[validate(length(
        min = 1,
        max = 100,
        message = "Payment method is required and must be less than 100 characters"
    ))]
    pub payment_method: String,

    pub transaction_id: Option<String>,

    #[validate(range(min = 0.01, message = "Amount must be greater than 0"))]
    pub amount: f64,

    #[serde(default = "default_currency")]
    pub currency: String,
}

fn default_currency() -> String {
    "USD".to_string()
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdatePaymentInfoDto {
    pub payment_method: Option<String>,
    pub transaction_id: Option<String>,

    #[validate(range(min = 0.01, message = "Amount must be greater than 0"))]
    pub amount: Option<f64>,

    pub currency: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentInfoDto {
    pub id: Uuid,
    pub order_id: Uuid,
    pub payment_method: String,
    pub transaction_id: Option<String>,
    pub amount: String,
    pub currency: String,
    pub status: String,
    pub is_paid: bool,
    pub payment_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<PaymentInfo> for PaymentInfoDto {
    fn from(info: PaymentInfo) -> Self {
        Self {
            id: info.id,
            order_id: info.order_id,
            payment_method: info.payment_method,
            transaction_id: info.transaction_id,
            amount: info.amount.to_string(),
            currency: info.currency,
            status: info.status.to_string(),
            is_paid: info.is_paid(),
            payment_date: info.payment_date,
            created_at: info.created_at,
            updated_at: info.updated_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct ProcessPaymentDto {
    pub order_id: String,
    pub payment_method: String,
    pub amount: f64,

    #[serde(default = "default_currency")]
    pub currency: String,

    pub payment_token: Option<String>,
    pub card_details: Option<CardDetailsDto>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CardDetailsDto {
    #[validate(length(min = 1, message = "Card holder name is required"))]
    pub holder_name: String,

    #[validate(length(equal = 16, message = "Card number must be 16 digits"))]
    pub card_number: String,

    #[validate(length(min = 3, max = 4, message = "CVV must be 3 or 4 digits"))]
    pub cvv: String,

    #[validate(length(equal = 5, message = "Expiry date must be in MM/YY format"))]
    pub expiry_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentResponseDto {
    pub success: bool,
    pub order_id: String,
    pub transaction_id: Option<String>,
    pub status: String,
    pub message: String,
    pub amount: String,
    pub currency: String,
    pub payment_date: Option<DateTime<Utc>>,
}
