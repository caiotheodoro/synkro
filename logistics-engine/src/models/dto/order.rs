use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use super::{
    CreateOrderItemDto, CreatePaymentInfoDto, CreateShippingInfoDto, OrderItemDto, PaymentInfoDto,
    ShippingInfoDto,
};

#[derive(Debug, Serialize, Deserialize, Validate, Clone)]
pub struct CreateOrderDto {
    #[validate(length(equal = 36, message = "Customer ID must be a valid UUID"))]
    pub customer_id: String,

    #[validate(length(min = 1, message = "Items are required"))]
    pub items: Vec<CreateOrderItemDto>,

    #[validate(nested)]
    pub shipping_info: CreateShippingInfoDto,

    #[validate(nested)]
    pub payment_info: CreatePaymentInfoDto,

    pub notes: Option<String>,

    #[serde(default = "default_currency")]
    pub currency: String,
}

fn default_currency() -> String {
    "USD".to_string()
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateOrderDto {
    pub status: Option<String>,
    pub tracking_number: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderResponseDto {
    pub id: Uuid,
    pub customer_id: Uuid,
    pub status: String,
    pub status_code: i32,
    pub total_amount: String,
    pub currency: String,
    pub tracking_number: Option<String>,
    pub notes: Option<String>,
    pub items: Vec<OrderItemDto>,
    pub shipping_info: Option<ShippingInfoDto>,
    pub payment_info: Option<PaymentInfoDto>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrdersResponseDto {
    pub orders: Vec<OrderResponseDto>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateOrderStatusDto {
    #[validate(length(min = 1, message = "Status is required"))]
    pub status: String,
    pub status_notes: Option<String>,
    pub changed_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderStatusEventDto {
    pub order_id: Uuid,
    pub previous_status: Option<String>,
    pub new_status: String,
    pub timestamp: DateTime<Utc>,
    pub notes: Option<String>,
}
