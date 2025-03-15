use crate::models::inventory::{
    CreateInventoryItemDto, CreateReservationDto, InventoryItem, InventoryReservation,
    ReservationStatus, UpdateInventoryItemDto, UpdateReservationDto,
};
use chrono::{DateTime, Utc};
use num_traits::ToPrimitive;
use rust_decimal;
use sqlx::{types::time::OffsetDateTime, Error, PgPool, Row};
use std::str::FromStr;
use uuid::Uuid;

pub struct InventoryRepository {
    pool: PgPool,
}

impl InventoryRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // Helper function to convert OffsetDateTime to DateTime<Utc>
    fn convert_datetime(offset_dt: OffsetDateTime) -> DateTime<Utc> {
        DateTime::<Utc>::from_timestamp(offset_dt.unix_timestamp(), offset_dt.nanosecond() as u32)
            .unwrap_or_else(|| Utc::now())
    }

    // Helper function to map PostgreSQL row to InventoryItem
    fn map_row_to_inventory_item(row: sqlx::postgres::PgRow) -> Result<InventoryItem, Error> {
        let id: Uuid = row.try_get("id")?;
        let sku: String = row.try_get("sku")?;
        let name: String = row.try_get("name")?;
        let description: Option<String> = row.try_get("description")?;
        let warehouse_id: Uuid = row.try_get("warehouse_id")?;

        let warehouse_name: Option<String> = row.try_get("warehouse_name").ok();
        let quantity: i32 = row.try_get("quantity")?;
        let created_at: OffsetDateTime = row.try_get("created_at")?;
        let updated_at: OffsetDateTime = row.try_get("updated_at")?;

        // Get price as BigDecimal and convert to rust_decimal::Decimal via string
        let price_bd: sqlx::types::BigDecimal = row.try_get("price")?;
        let price_str = price_bd.to_string();
        let price = rust_decimal::Decimal::from_str(&price_str).unwrap_or_default();
        let attributes: Option<serde_json::Value> = row.try_get("attributes")?;
        let category: Option<String> = row.try_get("category")?;

        Ok(InventoryItem {
            id,
            sku,
            name,
            description,
            warehouse_id,
            warehouse_name: warehouse_name.unwrap_or_default(),
            quantity,
            price,
            attributes,
            category,
            created_at: Self::convert_datetime(created_at),
            updated_at: Self::convert_datetime(updated_at),
        })
    }

    pub async fn find_all_items(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<InventoryItem>, Error> {
        let rows = sqlx::query(
            r#"
            SELECT
                inventory_items.id,
                inventory_items.sku,
                inventory_items.name,
                inventory_items.description,
                warehouses.name as warehouse_name,
                warehouses.id as warehouse_id,
                inventory_items.quantity,
                inventory_items.price,
                inventory_items.attributes,
                inventory_items.category,
                inventory_items.created_at,
                inventory_items.updated_at
            FROM inventory_items
            LEFT JOIN warehouses ON inventory_items.warehouse_id = warehouses.id
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(limit)
        .bind(offset)
        .map(Self::map_row_to_inventory_item)
        .fetch_all(&self.pool)
        .await?;

        let mut items = Vec::new();
        for row_result in rows {
            items.push(row_result?);
        }

        Ok(items)
    }

    pub async fn find_item_by_id(&self, id: Uuid) -> Result<Option<InventoryItem>, Error> {
        // Replace sqlx::query_as! with plain sqlx::query and custom mapper
        let row_result = sqlx::query(
            r#"
            SELECT
                inventory_items.id,
                inventory_items.sku,
                inventory_items.name,
                inventory_items.description,
                warehouses.name as warehouse_name,
                warehouses.id as warehouse_id,
                inventory_items.quantity,
                inventory_items.price,
                inventory_items.attributes,
                inventory_items.category,
                inventory_items.created_at,
                inventory_items.updated_at
            FROM inventory_items
            LEFT JOIN warehouses ON inventory_items.warehouse_id = warehouses.id
            WHERE inventory_items.id = $1
            "#,
        )
        .bind(id)
        .map(Self::map_row_to_inventory_item)
        .fetch_optional(&self.pool)
        .await?;

        match row_result {
            Some(row_result) => Ok(Some(row_result?)),
            None => Ok(None),
        }
    }

    pub async fn create_item(&self, dto: CreateInventoryItemDto) -> Result<InventoryItem, Error> {
        let row_result = sqlx::query(
            r#"
            INSERT INTO inventory_items
            (id, sku, name, description, warehouse_id, quantity, price, attributes, category)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING
                id,
                sku,
                name,
                description,
                warehouse_id,
                quantity,
                price,
                attributes,
                category,
                created_at,
                updated_at
            "#,
        )
        .bind(&dto.sku)
        .bind(&dto.name)
        .bind(&dto.description)
        .bind(&dto.warehouse_id)
        .bind(&dto.quantity)
        .bind(dto.price.to_f64().unwrap_or(0.0))
        .bind(&dto.attributes)
        .bind(&dto.category)
        .map(Self::map_row_to_inventory_item)
        .fetch_one(&self.pool)
        .await?;

        // Process result to handle nested Result
        Ok(row_result?)
    }

    pub async fn update_item(
        &self,
        id: Uuid,
        dto: UpdateInventoryItemDto,
    ) -> Result<Option<InventoryItem>, Error> {
        let current_item = self.find_item_by_id(id).await?;
        if current_item.is_none() {
            return Ok(None);
        }

        let current_item = current_item.unwrap();

        let row_result = sqlx::query(
            r#"
            UPDATE inventory_items
            SET
                sku = $1,
                name = $2,
                description = $3,
                warehouse_id = $4,
                quantity = $5,
                price = $6,
                attributes = $7,
                category = $8,
                updated_at = NOW()
            WHERE id = $9
            RETURNING
                id,
                sku,
                name,
                description,
                warehouse_id,
                quantity,
                price,
                attributes,
                category,
                created_at,
                updated_at
            "#,
        )
        .bind(dto.sku.unwrap_or(current_item.sku))
        .bind(dto.name.unwrap_or(current_item.name))
        .bind(dto.description.or(current_item.description))
        .bind(dto.warehouse_id.unwrap_or(current_item.warehouse_id))
        .bind(dto.quantity.unwrap_or(current_item.quantity))
        .bind(
            dto.price
                .map(|p| p.to_f64().unwrap_or(0.0))
                .unwrap_or(current_item.price.to_f64().unwrap_or(0.0)),
        )
        .bind(
            dto.attributes
                .unwrap_or(current_item.attributes.unwrap_or_default()),
        )
        .bind(
            dto.category
                .unwrap_or(current_item.category.unwrap_or_default()),
        )
        .bind(id)
        .map(Self::map_row_to_inventory_item)
        .fetch_optional(&self.pool)
        .await?;

        match row_result {
            Some(row_result) => Ok(Some(row_result?)),
            None => Ok(None),
        }
    }

    pub async fn delete_item(&self, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM inventory_items
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn adjust_quantity(
        &self,
        id: Uuid,
        quantity_delta: i32,
    ) -> Result<Option<InventoryItem>, Error> {
        // Replace sqlx::query_as! with plain sqlx::query and custom mapper
        let row_result = sqlx::query(
            r#"
            UPDATE inventory_items
            SET
                quantity = quantity + $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
            "#,
        )
        .bind(quantity_delta)
        .bind(id)
        .map(Self::map_row_to_inventory_item)
        .fetch_optional(&self.pool)
        .await?;

        // Process optional result to handle nested Result
        match row_result {
            Some(row_result) => Ok(Some(row_result?)),
            None => Ok(None),
        }
    }

    // Generic method to map from database row to InventoryReservation
    fn map_row_to_inventory_reservation(
        row: &sqlx::postgres::PgRow,
    ) -> Result<InventoryReservation, Error> {
        let id: Uuid = row.try_get("id")?;
        let order_id: Uuid = row.try_get("order_id")?;
        let status: String = row.try_get("status")?;
        let created_at: OffsetDateTime = row.try_get("created_at")?;
        let updated_at: OffsetDateTime = row.try_get("updated_at")?;

        // Convert OffsetDateTime to chrono::DateTime<Utc>
        let created_at_chrono = DateTime::<Utc>::from_timestamp(
            created_at.unix_timestamp(),
            created_at.nanosecond() as u32,
        )
        .unwrap_or_else(|| Utc::now());

        let updated_at_chrono = DateTime::<Utc>::from_timestamp(
            updated_at.unix_timestamp(),
            updated_at.nanosecond() as u32,
        )
        .unwrap_or_else(|| Utc::now());

        Ok(InventoryReservation {
            id,
            order_id,
            product_id: Uuid::nil(), // Default value
            sku: String::from(""),   // Default value
            quantity: 0,             // Default value
            status,
            expires_at: None,
            created_at: created_at_chrono,
            updated_at: updated_at_chrono,
        })
    }

    pub async fn find_all_reservations(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<InventoryReservation>, Error> {
        let query = "
            SELECT id, order_id, status, created_at, updated_at 
            FROM inventory_reservations
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        ";

        let rows = sqlx::query(query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?;

        let mut reservations = Vec::with_capacity(rows.len());
        for row in rows {
            reservations.push(Self::map_row_to_inventory_reservation(&row)?);
        }

        Ok(reservations)
    }

    pub async fn find_reservation_by_id(
        &self,
        id: Uuid,
    ) -> Result<Option<InventoryReservation>, Error> {
        let query = "
            SELECT id, order_id, status, created_at, updated_at 
            FROM inventory_reservations
            WHERE id = $1
        ";

        let row = sqlx::query(query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(row) => Ok(Some(Self::map_row_to_inventory_reservation(&row)?)),
            None => Ok(None),
        }
    }

    pub async fn create_reservation(
        &self,
        dto: CreateReservationDto,
    ) -> Result<InventoryReservation, Error> {
        let status = ReservationStatus::default();
        let status_str = status.to_string();

        let query = "
            INSERT INTO inventory_reservations
            (order_id, status, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            RETURNING id, order_id, status, created_at, updated_at
        ";

        let row = sqlx::query(query)
            .bind(dto.order_id)
            .bind(status_str)
            .fetch_one(&self.pool)
            .await?;

        let mut reservation = Self::map_row_to_inventory_reservation(&row)?;

        // Populate with DTO data
        reservation.product_id = dto.product_id;
        reservation.sku = dto.sku;
        reservation.quantity = dto.quantity;
        reservation.expires_at = dto.expires_at;

        Ok(reservation)
    }

    pub async fn update_reservation_status(
        &self,
        id: Uuid,
        status: ReservationStatus,
    ) -> Result<Option<InventoryReservation>, Error> {
        let status_str = status.to_string();

        // First fetch the existing reservation
        let existing = self.find_reservation_by_id(id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let query = "
            UPDATE inventory_reservations
            SET
                status = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING id, order_id, status, created_at, updated_at
        ";

        let row = sqlx::query(query)
            .bind(status_str)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(row) => {
                let mut updated = Self::map_row_to_inventory_reservation(&row)?;
                let existing = existing.unwrap();

                // Preserve fields not in the database
                updated.product_id = existing.product_id;
                updated.sku = existing.sku;
                updated.quantity = existing.quantity;
                updated.expires_at = existing.expires_at;

                Ok(Some(updated))
            }
            None => Ok(None),
        }
    }

    pub async fn update_reservation(
        &self,
        id: Uuid,
        dto: UpdateReservationDto,
    ) -> Result<Option<InventoryReservation>, Error> {
        let existing = self.find_reservation_by_id(id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let existing = existing.unwrap();
        let status_str = dto
            .status
            .map(|s| s.to_string())
            .unwrap_or(existing.status.clone());

        let query = "
            UPDATE inventory_reservations
            SET
                status = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING id, order_id, status, created_at, updated_at
        ";

        let row = sqlx::query(query)
            .bind(status_str)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(row) => {
                let mut updated = Self::map_row_to_inventory_reservation(&row)?;

                updated.product_id = existing.product_id;
                updated.sku = existing.sku;
                updated.quantity = dto.quantity.unwrap_or(existing.quantity);
                updated.expires_at = dto.expires_at.or(existing.expires_at);

                Ok(Some(updated))
            }
            None => Ok(None),
        }
    }

    pub async fn delete_reservation(&self, id: Uuid) -> Result<bool, Error> {
        let query = "
            DELETE FROM inventory_reservations
            WHERE id = $1
        ";

        let result = sqlx::query(query).bind(id).execute(&self.pool).await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn count_reservations(&self) -> Result<i64, Error> {
        let query = "
            SELECT COUNT(*) as count FROM inventory_reservations
        ";

        let row = sqlx::query(query).fetch_one(&self.pool).await?;

        let count: i64 = row.try_get("count")?;
        Ok(count)
    }

    pub async fn count_reservations_by_status(
        &self,
        status: ReservationStatus,
    ) -> Result<i64, Error> {
        let status_str = status.to_string();

        let query = "
            SELECT COUNT(*) as count FROM inventory_reservations
            WHERE status = $1
        ";

        let row = sqlx::query(query)
            .bind(status_str)
            .fetch_one(&self.pool)
            .await?;

        let count: i64 = row.try_get("count")?;
        Ok(count)
    }

    pub async fn search_items(
        &self,
        search_term: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<InventoryItem>, Error> {
        let search_pattern = format!("%{}%", search_term);
        let quantity_search = search_term.parse::<i32>().ok();

        let rows = sqlx::query(
            r#"
            SELECT
                inventory_items.id,
                inventory_items.sku,
                inventory_items.name,
                inventory_items.description,
                warehouses.name as warehouse_name,
                warehouses.id as warehouse_id,
                inventory_items.quantity,
                inventory_items.price,
                inventory_items.attributes,
                inventory_items.category,
                inventory_items.created_at,
                inventory_items.updated_at
            FROM inventory_items
            LEFT JOIN warehouses ON inventory_items.warehouse_id = warehouses.id
            WHERE inventory_items.id::text ILIKE $1
            OR inventory_items.name ILIKE $1
            OR inventory_items.sku ILIKE $1
            OR inventory_items.description ILIKE $1
            OR inventory_items.price::text ILIKE $1
            OR ($2::int IS NOT NULL AND inventory_items.quantity = $2)
            ORDER BY inventory_items.created_at DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(search_pattern)
        .bind(quantity_search)
        .bind(limit)
        .bind(offset)
        .map(Self::map_row_to_inventory_item)
        .fetch_all(&self.pool)
        .await?;

        let mut items = Vec::new();
        for row_result in rows {
            items.push(row_result?);
        }

        Ok(items)
    }

    pub async fn get_random_item(&self) -> Result<Option<InventoryItem>, sqlx::Error> {
        // Simplify the query to just get one random item by ID, then look it up
        let row = sqlx::query!(
            r#"
            SELECT id FROM inventory_items
            ORDER BY RANDOM()
            LIMIT 1
            "#
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            // Use the find_item_by_id method which already works
            match self.find_item_by_id(row.id).await {
                Ok(Some(item)) => Ok(Some(item)),
                Ok(None) => Ok(None),
                Err(e) => Err(sqlx::Error::ColumnNotFound(e.to_string())),
            }
        } else {
            Ok(None)
        }
    }

    pub async fn item_exists(&self, id: &Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            SELECT COUNT(*) as count 
            FROM inventory_items 
            WHERE id = $1
            "#,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0) > 0)
    }
}
