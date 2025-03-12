use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::shipping::ShippingInfo;

#[derive(Debug, Serialize, Deserialize, Validate, Clone)]
pub struct CreateShippingInfoDto {
    pub order_id: Uuid,

    #[validate(length(
        min = 1,
        max = 255,
        message = "Address line 1 is required and must be less than 255 characters"
    ))]
    pub address_line1: String,

    pub address_line2: Option<String>,

    #[validate(length(
        min = 1,
        max = 100,
        message = "City is required and must be less than 100 characters"
    ))]
    pub city: String,

    #[validate(length(
        min = 1,
        max = 100,
        message = "State is required and must be less than 100 characters"
    ))]
    pub state: String,

    #[validate(length(
        min = 1,
        max = 20,
        message = "Postal code is required and must be less than 20 characters"
    ))]
    pub postal_code: String,

    #[validate(length(
        min = 1,
        max = 100,
        message = "Country is required and must be less than 100 characters"
    ))]
    pub country: String,

    #[validate(length(
        min = 1,
        max = 255,
        message = "Recipient name is required and must be less than 255 characters"
    ))]
    pub recipient_name: String,

    pub recipient_phone: Option<String>,

    #[validate(length(
        min = 1,
        max = 100,
        message = "Shipping method is required and must be less than 100 characters"
    ))]
    pub shipping_method: String,

    #[validate(range(min = 0.0, message = "Shipping cost must be non-negative"))]
    pub shipping_cost: f64,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateShippingInfoDto {
    pub address_line1: Option<String>,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub recipient_name: Option<String>,
    pub recipient_phone: Option<String>,
    pub shipping_method: Option<String>,

    #[validate(range(min = 0.0, message = "Shipping cost must be non-negative"))]
    pub shipping_cost: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShippingInfoDto {
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
    pub shipping_cost: String,
    pub status: String,
    pub carrier: Option<String>,
    pub tracking_number: Option<String>,
    pub expected_delivery: Option<DateTime<Utc>>,
    pub actual_delivery: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<ShippingInfo> for ShippingInfoDto {
    fn from(info: ShippingInfo) -> Self {
        Self {
            id: info.id,
            order_id: info.order_id,
            address_line1: info.address_line1,
            address_line2: info.address_line2,
            city: info.city,
            state: info.state,
            postal_code: info.postal_code,
            country: info.country,
            recipient_name: info.recipient_name,
            recipient_phone: info.recipient_phone,
            shipping_method: info.shipping_method,
            shipping_cost: info.shipping_cost.to_string(),
            status: info.status.clone(),
            carrier: Some(info.carrier.clone()),
            tracking_number: Some(info.tracking_number.clone()),
            expected_delivery: info.expected_delivery,
            actual_delivery: info.actual_delivery,
            created_at: info.created_at,
            updated_at: info.updated_at,
        }
    }
}
