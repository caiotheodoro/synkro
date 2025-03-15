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
use chrono;
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
            // Filter out items without product_id before checking inventory
            let items_with_product_id = dto
                .items
                .iter()
                .filter(|item| item.product_id != Uuid::nil())
                .collect::<Vec<_>>();

            if !items_with_product_id.is_empty() {
                let product_items = items_with_product_id
                    .iter()
                    .map(|item| ProductItem {
                        product_id: item.product_id.to_string(),
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
        }

        // Start a database transaction
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(LogisticsError::DatabaseError)?;

        // Create a vector to store IDs of inventory items that need to be updated
        let inventory_updates = dto
            .items
            .iter()
            .map(|item| (item.product_id, item.quantity))
            .collect::<Vec<_>>();

        // Lock the inventory items for updating to prevent concurrency issues
        // This query doesn't modify anything but acquires row-level locks on the specified inventory items
        for (product_id, _) in &inventory_updates {
            // Using SELECT FOR UPDATE to lock the rows while the transaction is in progress
            let lock_result = sqlx::query(
                r#"
                SELECT id, quantity FROM inventory_items 
                WHERE id = $1
                FOR UPDATE
                "#,
            )
            .bind(product_id)
            .execute(&mut *tx)
            .await;

            if let Err(e) = lock_result {
                tx.rollback().await.ok(); // Rollback the transaction
                return Err(LogisticsError::DatabaseError(e));
            }
        }

        // Create the order first
        let order = self
            .create_order_in_transaction(&mut tx, dto.clone())
            .await?;

        // Create all order items
        for item_dto in &dto.items {
            self.create_order_item_in_transaction(&mut tx, order.id, item_dto)
                .await?;
        }

        // Create payment info
        let mut payment_dto = dto.payment_info.clone();
        payment_dto.order_id = order.id;
        self.create_payment_in_transaction(&mut tx, payment_dto)
            .await?;

        // Create shipping info
        let mut shipping_dto = dto.shipping_info.clone();
        shipping_dto.order_id = order.id;
        self.create_shipping_in_transaction(&mut tx, shipping_dto)
            .await?;

        // Now update the inventory quantities for each product
        for (product_id, quantity) in inventory_updates {
            // Reduce inventory by the ordered quantity
            let update_result = sqlx::query(
                r#"
                UPDATE inventory_items
                SET 
                    quantity = quantity - $1,
                    updated_at = NOW()
                WHERE id = $2 AND quantity >= $1
                RETURNING id, quantity
                "#,
            )
            .bind(quantity)
            .bind(product_id)
            .fetch_optional(&mut *tx)
            .await;

            match update_result {
                Ok(Some(_)) => {
                    // Successfully updated the inventory
                    info!(
                        "Reduced inventory for product {} by {}",
                        product_id, quantity
                    );
                }
                Ok(None) => {
                    // This means the WHERE condition failed (not enough quantity)
                    // Rollback the inventory changes but keep the order with OutOfStock status
                    tx.rollback().await.ok();

                    // Update order status to OutOfStock
                    let out_of_stock_update = UpdateOrderDto {
                        status: Some("out_of_stock".to_string()),
                        tracking_number: None,
                        notes: Some(format!("Insufficient inventory for product {}", product_id)),
                    };

                    match self
                        .order_repository
                        .update(order.id, out_of_stock_update)
                        .await
                    {
                        Ok(Some(updated_order)) => {
                            info!("Order {} marked as OutOfStock due to insufficient inventory for product {}", 
                                  order.id, product_id);
                            return Ok(updated_order);
                        }
                        Ok(None) => {
                            warn!("Could not update order {} to OutOfStock status", order.id);
                        }
                        Err(e) => {
                            warn!(
                                "Error updating order {} to OutOfStock status: {}",
                                order.id, e
                            );
                        }
                    }

                    return Err(LogisticsError::BadRequest(format!(
                        "Insufficient inventory for product {}",
                        product_id
                    )));
                }
                Err(e) => {
                    tx.rollback().await.ok(); // Rollback the transaction
                    return Err(LogisticsError::DatabaseError(e));
                }
            }
        }

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

        // If the order is already in the requested status, just return it
        if old_status == status {
            return Ok(old_order);
        }

        // Start a transaction if we're cancelling to handle inventory restoration
        let mut tx_option = None;

        // Special handling for cancellation: restore inventory
        if status == OrderStatus::Cancelled && old_status != OrderStatus::Cancelled {
            // Start a transaction
            let tx = self
                .pool
                .begin()
                .await
                .map_err(LogisticsError::DatabaseError)?;
            tx_option = Some(tx);

            // Get all order items
            let order_items = self.order_item_repository.find_by_order_id(id).await?;

            // Lock the inventory items for updating
            for item in &order_items {
                let lock_result = sqlx::query(
                    r#"
                    SELECT id, quantity FROM inventory_items 
                    WHERE id = $1
                    FOR UPDATE
                    "#,
                )
                .bind(item.product_id)
                .execute(&mut **tx_option.as_mut().unwrap())
                .await;

                if let Err(e) = lock_result {
                    if let Some(mut tx) = tx_option.take() {
                        tx.rollback().await.ok();
                    }
                    return Err(LogisticsError::DatabaseError(e));
                }
            }

            // Restore inventory quantities for each item
            for item in order_items {
                let restore_result = sqlx::query(
                    r#"
                    UPDATE inventory_items
                    SET 
                        quantity = quantity + $1,
                        updated_at = NOW()
                    WHERE id = $2
                    RETURNING id, quantity
                    "#,
                )
                .bind(item.quantity)
                .bind(item.product_id)
                .fetch_optional(&mut **tx_option.as_mut().unwrap())
                .await;

                match restore_result {
                    Ok(Some(_)) => {
                        info!(
                            "Restored inventory for product {} by {}",
                            item.product_id, item.quantity
                        );
                    }
                    Ok(None) => {
                        warn!("Could not restore inventory for product {}. Item may have been deleted.", item.product_id);
                    }
                    Err(e) => {
                        if let Some(mut tx) = tx_option.take() {
                            tx.rollback().await.ok();
                        }
                        return Err(LogisticsError::DatabaseError(e));
                    }
                }
            }
        }

        // Update the order status
        let updated_order = if let Some(mut tx) = tx_option {
            // If we're in a transaction, update the order status within it
            let update_result = sqlx::query!(
                r#"
                UPDATE orders
                SET 
                    status = $1,
                    notes = COALESCE($2, notes),
                    updated_at = NOW()
                WHERE id = $3
                RETURNING 
                    id, 
                    customer_id, 
                    total_amount as "total_amount!: BigDecimal", 
                    status as "status!: OrderStatus",
                    currency,
                    tracking_number,
                    notes,
                    created_at, 
                    updated_at
                "#,
                status as OrderStatus,
                notes,
                id
            )
            .fetch_one(&mut *tx)
            .await;

            // Commit the transaction
            match update_result {
                Ok(row) => {
                    tx.commit().await.map_err(LogisticsError::DatabaseError)?;

                    // Convert the datetime values ourselves
                    let created_dt = row.created_at;
                    let updated_dt = row.updated_at;
                    let created_at = chrono::DateTime::<chrono::Utc>::from_timestamp(
                        created_dt.unix_timestamp(),
                        created_dt.nanosecond(),
                    )
                    .unwrap_or_else(|| chrono::Utc::now());
                    let updated_at = chrono::DateTime::<chrono::Utc>::from_timestamp(
                        updated_dt.unix_timestamp(),
                        updated_dt.nanosecond(),
                    )
                    .unwrap_or_else(|| chrono::Utc::now());

                    Order {
                        id: row.id,
                        customer_id: row.customer_id,
                        customer_name: None,
                        total_amount: Decimal::from_str(&row.total_amount.to_string())
                            .unwrap_or_default(),
                        status: row.status,
                        currency: row.currency,
                        tracking_number: row.tracking_number,
                        notes: row.notes,
                        created_at,
                        updated_at,
                    }
                }
                Err(e) => {
                    tx.rollback().await.ok();
                    return Err(LogisticsError::DatabaseError(e));
                }
            }
        } else {
            // Use the regular repository method if we're not in a transaction
            let updated = self
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

            match updated {
                Some(order) => order,
                None => return Err(LogisticsError::NotFound("Order", id.to_string())),
            }
        };

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

        Ok(updated_order)
    }
}
