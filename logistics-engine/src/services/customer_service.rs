use std::sync::Arc;
use uuid::Uuid;

use crate::db::repository::CustomerRepository;
use crate::errors::{LogisticsError, Result};
use crate::models::{
    dto::customer::{CreateCustomerDto, UpdateCustomerDto},
    entities::customer::Customer,
};

pub struct CustomerService {
    repository: Arc<CustomerRepository>,
}

impl CustomerService {
    pub fn new(repository: Arc<CustomerRepository>) -> Self {
        Self { repository }
    }

    pub async fn get_all_customers(&self, page: u32, limit: u32) -> Result<Vec<Customer>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.repository
            .find_all(limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_customer_by_id(&self, id: Uuid) -> Result<Customer> {
        let customer = self.repository.find_by_id(id).await?;

        match customer {
            Some(customer) => Ok(customer),
            None => Err(LogisticsError::NotFound("Customer", id.to_string())),
        }
    }

    pub async fn get_customer_by_email(&self, email: &str) -> Result<Customer> {
        let customer = self.repository.find_by_email(email).await?;

        match customer {
            Some(customer) => Ok(customer),
            None => Err(LogisticsError::NotFound("Customer", email.to_string())),
        }
    }

    pub async fn create_customer(&self, dto: CreateCustomerDto) -> Result<Customer> {
        // Check if a customer with this email already exists
        let existing = self.repository.find_by_email(&dto.email).await?;
        if existing.is_some() {
            return Err(LogisticsError::ValidationError(format!(
                "Customer with email {} already exists",
                dto.email
            )));
        }

        // Create new customer
        self.repository
            .create(dto)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn update_customer(&self, id: Uuid, dto: UpdateCustomerDto) -> Result<Customer> {
        // Validate email uniqueness if it's being changed
        if let Some(ref email) = dto.email {
            let existing = self.repository.find_by_email(email).await?;
            if let Some(existing) = existing {
                if existing.id != id {
                    return Err(LogisticsError::ValidationError(format!(
                        "Customer with email {} already exists",
                        email
                    )));
                }
            }
        }

        let updated = self.repository.update(id, dto).await?;

        match updated {
            Some(customer) => Ok(customer),
            None => Err(LogisticsError::NotFound("Customer", id.to_string())),
        }
    }

    pub async fn delete_customer(&self, id: Uuid) -> Result<bool> {
        // Ensure customer exists
        let customer = self.repository.find_by_id(id).await?;
        if customer.is_none() {
            return Err(LogisticsError::NotFound("Customer", id.to_string()));
        }

        self.repository
            .delete(id)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_customers(&self) -> Result<i64> {
        self.repository.count().await.map_err(LogisticsError::from)
    }
}
