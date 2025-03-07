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

    pub async fn get_all_customers(
        &self,
        page: u32,
        limit: u32,
        search: Option<String>,
    ) -> Result<Vec<Customer>> {
        let limit = limit as i64;
        let offset = (page - 1) as i64 * limit;

        match search {
            Some(search_term) => self
                .repository
                .search_customers(&search_term, limit, offset)
                .await
                .map_err(LogisticsError::from),
            None => self
                .repository
                .find_all(limit, offset)
                .await
                .map_err(LogisticsError::from),
        }
    }

    pub async fn get_customer_by_id(&self, id: Uuid) -> Result<Customer> {
        let customer = self.repository.find_by_id(id).await?;

        match customer {
            Some(customer) => Ok(customer),
            None => Err(LogisticsError::NotFound("Customer", id.to_string())),
        }
    }

    pub async fn create_customer(&self, dto: CreateCustomerDto) -> Result<Customer> {
        let existing = self.repository.find_by_email(&dto.email).await?;
        if existing.is_some() {
            return Err(LogisticsError::ValidationError(format!(
                "Customer with email {} already exists",
                dto.email
            )));
        }

        self.repository
            .create(dto)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn update_customer(&self, id: Uuid, dto: UpdateCustomerDto) -> Result<Customer> {
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
}
