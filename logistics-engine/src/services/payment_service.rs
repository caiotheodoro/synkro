use rust_decimal::prelude::ToPrimitive;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    db::repository::payment_repository::PaymentRepository,
    errors::{LogisticsError, Result},
    models::{
        dto::payment::{CreatePaymentInfoDto, PaymentInfoDto as PaymentDto, UpdatePaymentInfoDto},
        entities::payment_info::PaymentInfo,
        payment::PaymentStatus,
    },
};

// Helper function to convert from repository PaymentInfo to PaymentDto
fn convert_to_dto(payment: PaymentInfo) -> PaymentDto {
    let status_str = payment.status_str.clone();
    let is_paid = status_str == PaymentStatus::Succeeded.as_str();

    PaymentDto {
        id: payment.id,
        order_id: payment.order_id,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        amount: payment.amount.to_string(),
        currency: payment.currency,
        status: status_str,
        is_paid,
        payment_date: payment.payment_date,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
    }
}

pub struct PaymentService {
    repository: Arc<PaymentRepository>,
}

impl PaymentService {
    pub fn new(repository: Arc<PaymentRepository>) -> Self {
        Self { repository }
    }

    pub async fn get_all_payments(&self, limit: i64, offset: i64) -> Result<Vec<PaymentDto>> {
        let payments = self
            .repository
            .find_all(limit, offset)
            .await
            .map_err(LogisticsError::from)?;

        Ok(payments.into_iter().map(convert_to_dto).collect())
    }

    pub async fn get_payment_by_id(&self, id: &Uuid) -> Result<Option<PaymentDto>> {
        let payment = self
            .repository
            .find_by_id(*id)
            .await
            .map_err(LogisticsError::from)?;

        Ok(payment.map(convert_to_dto))
    }

    pub async fn get_payment_by_order(&self, order_id: &Uuid) -> Result<Option<PaymentDto>> {
        let payment = self
            .repository
            .find_by_order_id(*order_id)
            .await
            .map_err(LogisticsError::from)?;

        Ok(payment.into_iter().next().map(convert_to_dto))
    }

    pub async fn get_payments_by_status(
        &self,
        status: PaymentStatus,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<PaymentDto>> {
        let payments = self
            .repository
            .find_by_status(status, limit, offset)
            .await
            .map_err(LogisticsError::from)?;

        Ok(payments.into_iter().map(convert_to_dto).collect())
    }

    pub async fn create_payment(&self, dto: CreatePaymentInfoDto) -> Result<PaymentDto> {
        // Validate payment amount is greater than 0
        if dto.amount <= 0.0 {
            return Err(LogisticsError::ValidationError(
                "Payment amount must be greater than 0".to_string(),
            ));
        }

        let payment = self
            .repository
            .create(dto)
            .await
            .map_err(LogisticsError::from)?;

        Ok(convert_to_dto(payment))
    }

    pub async fn update_payment(
        &self,
        id: &Uuid,
        dto: UpdatePaymentInfoDto,
    ) -> Result<Option<PaymentDto>> {
        // Validate payment amount is greater than 0 if provided
        if let Some(amount) = dto.amount {
            if amount <= 0.0 {
                return Err(LogisticsError::ValidationError(
                    "Payment amount must be greater than 0".to_string(),
                ));
            }
        }

        let updated = self
            .repository
            .update(*id, dto)
            .await
            .map_err(LogisticsError::from)?;

        Ok(updated.map(convert_to_dto))
    }

    pub async fn process_payment(
        &self,
        id: &Uuid,
        transaction_id: Option<String>,
    ) -> Result<Option<PaymentDto>> {
        // For now, use update_status since we don't have a dedicated process_payment method
        let updated = self
            .repository
            .update_status(*id, PaymentStatus::Succeeded)
            .await
            .map_err(LogisticsError::from)?;

        Ok(updated.map(convert_to_dto))
    }

    pub async fn refund_payment(&self, id: &Uuid) -> Result<Option<PaymentDto>> {
        let payment = self.get_payment_by_id(id).await?;

        if let Some(payment) = payment {
            if payment.status != PaymentStatus::Succeeded.as_str() {
                return Err(LogisticsError::ValidationError(
                    "Only succeeded payments can be refunded".to_string(),
                ));
            }

            // Use update_status for now
            let updated = self
                .repository
                .update_status(*id, PaymentStatus::Refunded)
                .await
                .map_err(LogisticsError::from)?;

            Ok(updated.map(convert_to_dto))
        } else {
            Err(LogisticsError::NotFound("Payment", id.to_string()))
        }
    }

    pub async fn cancel_payment(&self, id: &Uuid) -> Result<Option<PaymentDto>> {
        let payment = self.get_payment_by_id(id).await?;

        if let Some(payment) = payment {
            if payment.status != PaymentStatus::Pending.as_str() {
                return Err(LogisticsError::ValidationError(
                    "Only pending payments can be canceled".to_string(),
                ));
            }

            // Use update_status for now
            let updated = self
                .repository
                .update_status(*id, PaymentStatus::Cancelled)
                .await
                .map_err(LogisticsError::from)?;

            Ok(updated.map(convert_to_dto))
        } else {
            Err(LogisticsError::NotFound("Payment", id.to_string()))
        }
    }

    pub async fn delete_payment(&self, id: &Uuid) -> Result<bool> {
        let result = self
            .repository
            .delete(*id)
            .await
            .map_err(LogisticsError::from)?;

        Ok(result)
    }

    pub async fn count_payments(&self) -> Result<i64> {
        let count = self
            .repository
            .count()
            .await
            .map_err(LogisticsError::from)?;

        Ok(count)
    }

    pub async fn count_payments_by_status(&self, status: PaymentStatus) -> Result<i64> {
        let count = self
            .repository
            .count_by_status(status)
            .await
            .map_err(LogisticsError::from)?;

        Ok(count)
    }

    pub async fn update_status(
        &self,
        id: &Uuid,
        status: PaymentStatus,
    ) -> Result<Option<PaymentDto>> {
        let updated = self
            .repository
            .update_status(*id, status)
            .await
            .map_err(LogisticsError::from)?;

        Ok(updated.map(convert_to_dto))
    }
}
