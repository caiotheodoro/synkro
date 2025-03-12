use crate::db::repository::{
    OrderItemRepository, OrderRepository, PaymentRepository, ShippingRepository,
};
use crate::errors::{LogisticsError, Result};
use crate::grpc::inventory;
use crate::models::order_item::OrderItem;
use crate::models::{
    dto::order::{CreateOrderDto, UpdateOrderDto},
    dto::payment::CreatePaymentInfoDto,
    dto::shipping::CreateShippingInfoDto,
    entities::order::{Order, OrderStatus},
};
use crate::mq::events::{
    EventType, OrderCancelledEvent, OrderCreatedEvent, OrderStatusChangedEvent,
};
use crate::mq::publisher;
use crate::proto::inventory::ProductItem;
use num_traits::FromPrimitive;
use rust_decimal::Decimal;
use sqlx::types::BigDecimal;
use sqlx::{Pool, Postgres, Transaction};
use std::str::FromStr;
use std::sync::Arc;
use tracing::{info, warn};
use uuid::Uuid;

pub struct OrderService {
    order_repository: Arc<OrderRepository>,
    order_item_repository: Arc<OrderItemRepository>,
    payment_repository: Arc<PaymentRepository>,
    shipping_repository: Arc<ShippingRepository>,
    pool: Pool<Postgres>,
}

impl OrderService {
    pub fn new(
        order_repository: Arc<OrderRepository>,
        order_item_repository: Arc<OrderItemRepository>,
        payment_repository: Arc<PaymentRepository>,
        shipping_repository: Arc<ShippingRepository>,
        pool: Pool<Postgres>,
    ) -> Self {
        Self {
            order_repository,
            order_item_repository,
            payment_repository,
            shipping_repository,
            pool,
        }
    }

    pub async fn get_all_orders(
        &self,
        page: u32,
        limit: u32,
        search: Option<String>,
    ) -> Result<Vec<Order>> {
        let limit = limit as i64;
        let offset = (page - 1) as i64 * limit;

        match search {
            Some(search_term) => self
                .order_repository
                .search_orders(&search_term, limit, offset)
                .await
                .map_err(LogisticsError::from),
            None => self
                .order_repository
                .find_all(limit, offset)
                .await
                .map_err(LogisticsError::from),
        }
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
        let offset = (page - 1) as i64 * limit;

        self.order_repository
            .find_by_customer_id(customer_id, limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn create_order(&self, dto: CreateOrderDto) -> Result<Order> {
        if let Ok(inventory_client) = crate::grpc::get_inventory_client().await {
            let product_items = dto
                .items
                .iter()
                .map(|item| ProductItem {
                    product_id: item.product_id.clone(),
                    sku: item.sku.clone(),
                    quantity: item.quantity,
                })
                .collect::<Vec<_>>();

            // Generate a temporary order ID
            let temp_order_id = Uuid::new_v4().to_string();

            // Warehouse ID (use a default if not provided)
            let warehouse_id = "default-warehouse".to_string();

            // Try to reserve inventory
            match inventory_client
                .check_and_reserve_stock(temp_order_id, product_items, warehouse_id)
                .await
            {
                Ok(reservation) => {
                    if !reservation.success {
                        return Err(LogisticsError::BadRequest(format!(
                            "Inventory check failed: {}",
                            reservation.message
                        )));
                    }
                }
                Err(e) => {
                    warn!("Failed to check inventory: {}", e);
                }
            }
        }

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(LogisticsError::DatabaseError)?;

        let order = self
            .create_order_in_transaction(&mut tx, dto.clone())
            .await?;

        for item_dto in &dto.items {
            self.create_order_item_in_transaction(&mut tx, order.id, item_dto)
                .await?;
        }

        let mut payment_dto = dto.payment_info.clone();
        payment_dto.order_id = order.id; // Set the correct order ID
        self.create_payment_in_transaction(&mut tx, payment_dto)
            .await?;

        // 4. Create shipping info
        let mut shipping_dto = dto.shipping_info.clone();
        shipping_dto.order_id = order.id; // Set the correct order ID
        self.create_shipping_in_transaction(&mut tx, shipping_dto)
            .await?;

        // Commit the transaction
        tx.commit().await.map_err(LogisticsError::DatabaseError)?;

        // Publish order created event
        let event_data = OrderCreatedEvent {
            order_id: order.id,
            customer_id: order.customer_id,
            status: format!("{:?}", order.status),
            total_amount: order.total_amount.to_string(),
            items_count: dto.items.len() as i32,
        };

        if let Err(e) =
            publisher::publish_event(EventType::OrderCreated, "order.created", event_data).await
        {
            // Log error but don't fail the request
            warn!("Failed to publish order created event: {}", e);
        }

        Ok(order)
    }

    async fn create_order_in_transaction(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        dto: CreateOrderDto,
    ) -> Result<Order> {
        self.order_repository
            .create_with_transaction(tx, dto)
            .await
            .map_err(LogisticsError::from)
    }

    async fn create_order_item_in_transaction(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        order_id: Uuid,
        item_dto: &crate::models::dto::order_item::CreateOrderItemDto,
    ) -> Result<()> {
        self.order_item_repository
            .create_with_transaction(tx, order_id, item_dto)
            .await
            .map_err(LogisticsError::from)?;
        Ok(())
    }

    async fn create_payment_in_transaction(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        payment_dto: CreatePaymentInfoDto,
    ) -> Result<()> {
        self.payment_repository
            .create_with_transaction(tx, payment_dto)
            .await
            .map_err(LogisticsError::from)?;

        Ok(())
    }

    async fn create_shipping_in_transaction(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        shipping_dto: CreateShippingInfoDto,
    ) -> Result<()> {
        self.shipping_repository
            .create_with_transaction(tx, shipping_dto)
            .await
            .map_err(LogisticsError::from)?;

        Ok(())
    }

    pub async fn update_order(&self, id: Uuid, dto: UpdateOrderDto) -> Result<Order> {
        let updated = self.order_repository.update(id, dto).await?;

        match updated {
            Some(order) => Ok(order),
            None => Err(LogisticsError::NotFound("Order", id.to_string())),
        }
    }

    pub async fn get_order_items(&self, order_id: Uuid) -> Result<Vec<OrderItem>> {
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
                results
                    .iter()
                    .find(|(s, _)| *s == status)
                    .map_or(0, |(_, count)| *count)
            })
            .map_err(LogisticsError::from)
    }

    pub async fn update_order_status(
        &self,
        id: Uuid,
        status: OrderStatus,
        notes: Option<String>,
    ) -> Result<Order> {
        let order = self.order_repository.find_by_id(id).await?;

        if order.is_none() {
            return Err(LogisticsError::NotFound("Order", id.to_string()));
        }

        let old_order = order.unwrap();
        let old_status = old_order.status.clone();

        let updated_order = self
            .order_repository
            .update(
                id,
                UpdateOrderDto {
                    status: Some(status.to_string()),
                    tracking_number: None,
                    notes: notes.clone(),
                },
            )
            .await?;

        let event_data = OrderStatusChangedEvent {
            order_id: id,
            previous_status: Some(format!("{:?}", old_status)),
            new_status: format!("{:?}", status),
            changed_by: None,
            notes: notes.clone(),
        };

        if let Err(e) = publisher::publish_event(
            EventType::OrderStatusChanged,
            &format!("order.status.{}", status.to_string().to_lowercase()),
            event_data,
        )
        .await
        {
            warn!("Failed to publish order status changed event: {}", e);
        }

        if status == OrderStatus::Cancelled {
            let cancel_event = OrderCancelledEvent {
                order_id: id,
                reason: notes
                    .clone()
                    .unwrap_or_else(|| "No reason provided".to_string()),
                cancelled_by: None,
            };

            if let Err(e) =
                publisher::publish_event(EventType::OrderCancelled, "order.cancelled", cancel_event)
                    .await
            {
                warn!("Failed to publish order cancelled event: {}", e);
            }

            if let Ok(inventory_client) = crate::grpc::get_inventory_client().await {
                let reservation_id = format!("reservation-{}", id);

                match inventory_client
                    .release_reserved_stock(
                        reservation_id,
                        id.to_string(),
                        "Order cancelled".to_string(),
                    )
                    .await
                {
                    Ok(_) => info!(
                        "Successfully released inventory reservation for cancelled order {}",
                        id
                    ),
                    Err(e) => warn!(
                        "Failed to release inventory for cancelled order {}: {}",
                        id, e
                    ),
                }
            }
        }

        Ok(updated_order.unwrap())
    }
}
