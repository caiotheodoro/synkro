use std::sync::Arc;
use uuid::Uuid;

use crate::{
    db::repository::shipping_repository::ShippingRepository,
    errors::{LogisticsError, Result},
    models::{
        dto::shipping::{
            CreateShippingInfoDto, ShippingInfoDto as ShippingDto, UpdateShippingInfoDto,
        },
        entities::shipping_info::ShippingInfo,
        shipping::ShippingStatus,
    },
};

fn convert_to_dto(shipping: ShippingInfo) -> ShippingDto {
    ShippingDto {
        id: shipping.id,
        order_id: shipping.order_id,
        address_line1: shipping.address_line1,
        address_line2: shipping.address_line2,
        city: shipping.city,
        state: shipping.state,
        postal_code: shipping.postal_code,
        country: shipping.country,
        recipient_name: shipping.recipient_name,
        recipient_phone: shipping.recipient_phone,
        shipping_method: shipping.shipping_method,
        shipping_cost: shipping.shipping_cost.to_string(),
        status: shipping.status,
        carrier: shipping.carrier,
        tracking_number: shipping.tracking_number,
        expected_delivery: shipping.expected_delivery,
        actual_delivery: shipping.actual_delivery,
        created_at: shipping.created_at,
        updated_at: shipping.updated_at,
    }
}

pub struct ShippingService {
    repository: Arc<ShippingRepository>,
}

impl ShippingService {
    pub fn new(repository: Arc<ShippingRepository>) -> Self {
        Self { repository }
    }

    pub async fn get_all_shipments(&self, limit: i64, offset: i64) -> Result<Vec<ShippingDto>> {
        let shipments = self
            .repository
            .find_all(limit, offset)
            .await
            .map_err(LogisticsError::from)?;

        Ok(shipments.into_iter().map(convert_to_dto).collect())
    }

    pub async fn get_shipment_by_id(&self, id: &Uuid) -> Result<Option<ShippingDto>> {
        let shipping = self
            .repository
            .find_by_id(*id)
            .await
            .map_err(LogisticsError::from)?;

        Ok(shipping.map(convert_to_dto))
    }

    pub async fn get_shipment_by_tracking(
        &self,
        tracking_number: &str,
    ) -> Result<Option<ShippingDto>> {
        let shipping = self
            .repository
            .find_by_tracking_number(tracking_number)
            .await
            .map_err(LogisticsError::from)?;

        Ok(shipping.map(convert_to_dto))
    }

    pub async fn create_shipment(&self, dto: CreateShippingInfoDto) -> Result<ShippingDto> {
        let shipping = self
            .repository
            .create(dto)
            .await
            .map_err(LogisticsError::from)?;

        Ok(convert_to_dto(shipping))
    }

    pub async fn update_shipment_status(
        &self,
        id: &Uuid,
        status: ShippingStatus,
    ) -> Result<Option<ShippingDto>> {
        let updated = self
            .repository
            .update_status(*id, status)
            .await
            .map_err(LogisticsError::from)?;

        Ok(updated.map(convert_to_dto))
    }

    pub async fn update_shipment(
        &self,
        id: &Uuid,
        dto: UpdateShippingInfoDto,
    ) -> Result<Option<ShippingDto>> {
        let updated = self
            .repository
            .update(*id, dto)
            .await
            .map_err(LogisticsError::from)?;

        Ok(updated.map(convert_to_dto))
    }

    pub async fn mark_as_delivered(&self, id: &Uuid) -> Result<Option<ShippingDto>> {
        self.update_status(id, ShippingStatus::Delivered).await
    }

    pub async fn delete_shipment(&self, id: &Uuid) -> Result<bool> {
        let result = self
            .repository
            .delete(*id)
            .await
            .map_err(LogisticsError::from)?;

        Ok(result)
    }

    pub async fn update_status(
        &self,
        id: &Uuid,
        status: ShippingStatus,
    ) -> Result<Option<ShippingDto>> {
        let updated = self
            .repository
            .update_status(*id, status)
            .await
            .map_err(LogisticsError::from)?;

        Ok(updated.map(convert_to_dto))
    }
}
