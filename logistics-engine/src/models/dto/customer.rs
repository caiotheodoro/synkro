use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::entities::Customer;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateCustomerDto {
    #[validate(length(
        min = 1,
        max = 255,
        message = "Name cannot be empty and must be less than 255 characters"
    ))]
    pub name: String,

    #[validate(email(message = "Email must be a valid email address"))]
    pub email: String,

    pub phone: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateCustomerDto {
    #[validate(length(
        min = 1,
        max = 255,
        message = "Name cannot be empty and must be less than 255 characters"
    ))]
    pub name: Option<String>,

    #[validate(email(message = "Email must be a valid email address"))]
    pub email: Option<String>,

    pub phone: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerResponseDto {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Customer> for CustomerResponseDto {
    fn from(customer: Customer) -> Self {
        Self {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            created_at: customer.created_at,
            updated_at: customer.updated_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomersResponseDto {
    pub customers: Vec<CustomerResponseDto>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
}
