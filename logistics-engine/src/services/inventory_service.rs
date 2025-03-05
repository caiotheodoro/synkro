use std::sync::Arc;
use uuid::Uuid;

use crate::db::repository::inventory_repository::InventoryRepository;
use crate::errors::{LogisticsError, Result};
use crate::models::inventory::{
    CreateInventoryItemDto, CreateReservationDto, InventoryItem, InventoryReservation,
    ReservationStatus, UpdateInventoryItemDto, UpdateReservationDto,
};

pub struct InventoryService {
    repository: Arc<InventoryRepository>,
}

impl InventoryService {
    pub fn new(repository: Arc<InventoryRepository>) -> Self {
        Self { repository }
    }

    // Inventory Item Methods
    pub async fn get_all_items(&self, page: u32, limit: u32) -> Result<Vec<InventoryItem>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.repository
            .find_all_items(limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_item_by_id(&self, id: Uuid) -> Result<InventoryItem> {
        let item = self.repository.find_item_by_id(id).await?;

        match item {
            Some(item) => Ok(item),
            None => Err(LogisticsError::NotFound("Inventory Item", id.to_string())),
        }
    }

    pub async fn get_items_by_sku(&self, sku: &str) -> Result<Vec<InventoryItem>> {
        self.repository
            .find_items_by_sku(sku)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_items_by_warehouse(
        &self,
        warehouse_id: Uuid,
        page: u32,
        limit: u32,
    ) -> Result<Vec<InventoryItem>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.repository
            .find_items_by_warehouse_id(warehouse_id, limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn create_item(&self, dto: CreateInventoryItemDto) -> Result<InventoryItem> {
        // Validate quantity is non-negative
        if dto.quantity < 0 {
            return Err(LogisticsError::ValidationError(
                "Inventory item quantity cannot be negative".to_string(),
            ));
        }

        self.repository
            .create_item(dto)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn update_item(
        &self,
        id: Uuid,
        dto: UpdateInventoryItemDto,
    ) -> Result<InventoryItem> {
        // Validate quantity is non-negative if provided
        if let Some(quantity) = dto.quantity {
            if quantity < 0 {
                return Err(LogisticsError::ValidationError(
                    "Inventory item quantity cannot be negative".to_string(),
                ));
            }
        }

        let updated = self.repository.update_item(id, dto).await?;

        match updated {
            Some(item) => Ok(item),
            None => Err(LogisticsError::NotFound("Inventory Item", id.to_string())),
        }
    }

    pub async fn adjust_quantity(&self, id: Uuid, quantity_delta: i32) -> Result<InventoryItem> {
        let item = self.repository.find_item_by_id(id).await?;

        if item.is_none() {
            return Err(LogisticsError::NotFound("Inventory Item", id.to_string()));
        }

        let item = item.unwrap();
        let new_quantity = item.quantity + quantity_delta;

        if new_quantity < 0 {
            return Err(LogisticsError::ValidationError(format!(
                "Cannot adjust quantity by {} as it would result in negative inventory",
                quantity_delta
            )));
        }

        let adjusted = self.repository.adjust_quantity(id, quantity_delta).await?;

        match adjusted {
            Some(item) => Ok(item),
            None => Err(LogisticsError::NotFound("Inventory Item", id.to_string())),
        }
    }

    pub async fn delete_item(&self, id: Uuid) -> Result<bool> {
        // Ensure item exists
        let item = self.repository.find_item_by_id(id).await?;
        if item.is_none() {
            return Err(LogisticsError::NotFound("Inventory Item", id.to_string()));
        }

        self.repository
            .delete_item(id)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_items(&self) -> Result<i64> {
        self.repository
            .count_items()
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_all_reservations(
        &self,
        page: u32,
        limit: u32,
    ) -> Result<Vec<InventoryReservation>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.repository
            .find_all_reservations(limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_reservation_by_id(&self, id: Uuid) -> Result<InventoryReservation> {
        let reservation = self.repository.find_reservation_by_id(id).await?;

        match reservation {
            Some(reservation) => Ok(reservation),
            None => Err(LogisticsError::NotFound("Reservation", id.to_string())),
        }
    }

    pub async fn get_reservations_by_order(
        &self,
        order_id: Uuid,
    ) -> Result<Vec<InventoryReservation>> {
        self.repository
            .find_reservations_by_order_id(order_id)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_reservations_by_status(
        &self,
        status: ReservationStatus,
        page: u32,
        limit: u32,
    ) -> Result<Vec<InventoryReservation>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.repository
            .find_reservations_by_status(status, limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn create_reservation(
        &self,
        dto: CreateReservationDto,
    ) -> Result<InventoryReservation> {
        self.repository
            .create_reservation(dto)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn update_reservation_status(
        &self,
        id: Uuid,
        status: ReservationStatus,
    ) -> Result<InventoryReservation> {
        let updated = self
            .repository
            .update_reservation_status(id, status)
            .await?;

        match updated {
            Some(reservation) => Ok(reservation),
            None => Err(LogisticsError::NotFound("Reservation", id.to_string())),
        }
    }

    pub async fn update_reservation(
        &self,
        id: Uuid,
        dto: UpdateReservationDto,
    ) -> Result<InventoryReservation> {
        let updated = self.repository.update_reservation(id, dto).await?;

        match updated {
            Some(reservation) => Ok(reservation),
            None => Err(LogisticsError::NotFound("Reservation", id.to_string())),
        }
    }

    pub async fn delete_reservation(&self, id: Uuid) -> Result<bool> {
        // Ensure reservation exists
        let reservation = self.repository.find_reservation_by_id(id).await?;
        if reservation.is_none() {
            return Err(LogisticsError::NotFound("Reservation", id.to_string()));
        }

        self.repository
            .delete_reservation(id)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_reservations(&self) -> Result<i64> {
        self.repository
            .count_reservations()
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_reservations_by_status(&self, status: ReservationStatus) -> Result<i64> {
        self.repository
            .count_reservations_by_status(status)
            .await
            .map_err(LogisticsError::from)
    }
}
