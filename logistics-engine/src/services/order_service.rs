use sqlx::types::BigDecimal;
use std::sync::Arc;
use uuid::Uuid;

use crate::db::repository::{OrderItemRepository, OrderRepository};
use crate::errors::{LogisticsError, Result};
use crate::models::order_item::OrderItem;
use crate::models::{
    dto::order::{CreateOrderDto, UpdateOrderDto},
    entities::order::{Order, OrderStatus},
};

pub struct OrderService {
    order_repository: Arc<OrderRepository>,
    order_item_repository: Arc<OrderItemRepository>,
}

impl OrderService {
    pub fn new(
        order_repository: Arc<OrderRepository>,
        order_item_repository: Arc<OrderItemRepository>,
    ) -> Self {
        Self {
            order_repository,
            order_item_repository,
        }
    }

    pub async fn get_all_orders(&self, page: u32, limit: u32) -> Result<Vec<Order>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.order_repository
            .find_all(limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_order_by_id(&self, id: Uuid) -> Result<Order> {
        let order = self.order_repository.find_by_id(id).await?;

        match order {
            Some(order) => Ok(order),
            None => Err(LogisticsError::NotFound("Order", id.to_string())),
        }
    }

    pub async fn get_orders_by_customer(
        &self,
        customer_id: Uuid,
        page: u32,
        limit: u32,
    ) -> Result<Vec<Order>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.order_repository
            .find_by_customer_id(customer_id, limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn create_order(&self, dto: CreateOrderDto) -> Result<Order> {
        // Validate order items
        if dto.items.is_empty() {
            return Err(LogisticsError::ValidationError(
                "Order must have at least one item".to_string(),
            ));
        }

        // Create order
        self.order_repository
            .create(dto)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn update_order(&self, id: Uuid, dto: UpdateOrderDto) -> Result<Order> {
        let updated = self.order_repository.update(id, dto).await?;

        match updated {
            Some(order) => Ok(order),
            None => Err(LogisticsError::NotFound("Order", id.to_string())),
        }
    }

    pub async fn update_order_status(&self, id: Uuid, status: OrderStatus) -> Result<Order> {
        let dto = UpdateOrderDto {
            status: Some(status.to_string()),
            tracking_number: None,
            notes: None,
        };

        self.update_order(id, dto).await
    }

    pub async fn get_order_items(&self, order_id: Uuid) -> Result<Vec<OrderItem>> {
        // Check if order exists
        let order = self.order_repository.find_by_id(order_id).await?;
        if order.is_none() {
            return Err(LogisticsError::NotFound("Order", order_id.to_string()));
        }

        self.order_item_repository
            .find_by_order_id(order_id)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn update_order_item(&self, item_id: Uuid, quantity: i32) -> Result<OrderItem> {
        if quantity <= 0 {
            return Err(LogisticsError::ValidationError(
                "Item quantity must be positive".to_string(),
            ));
        }

        let dto = crate::models::order_item::UpdateOrderItemDto {
            quantity: Some(quantity),
        };

        let updated = self.order_item_repository.update(item_id, dto).await?;

        match updated {
            Some(item) => Ok(item),
            None => Err(LogisticsError::NotFound("Order Item", item_id.to_string())),
        }
    }

    pub async fn delete_order_item(&self, item_id: Uuid) -> Result<bool> {
        let result = self.order_item_repository.delete(item_id).await?;

        if !result {
            return Err(LogisticsError::NotFound("Order Item", item_id.to_string()));
        }

        Ok(result)
    }

    pub async fn calculate_order_total(&self, order_id: Uuid) -> Result<BigDecimal> {
        // Check if order exists
        let order = self.order_repository.find_by_id(order_id).await?;
        if order.is_none() {
            return Err(LogisticsError::NotFound("Order", order_id.to_string()));
        }

        self.order_item_repository
            .get_total_for_order(order_id)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_orders(&self) -> Result<i64> {
        self.order_repository
            .count()
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_orders_by_status(&self, status: OrderStatus) -> Result<i64> {
        self.order_repository
            .count_by_status(Some(status))
            .await
            .map(|results| {
                // Find the matching status in the results
                results
                    .iter()
                    .find(|(s, _)| *s == status)
                    .map_or(0, |(_, count)| *count)
            })
            .map_err(LogisticsError::from)
    }
}
