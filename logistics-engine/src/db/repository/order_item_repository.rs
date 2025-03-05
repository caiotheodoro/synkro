use chrono::{DateTime, Utc};
use sqlx::{types::BigDecimal, Error, PgPool, Row};
use time::OffsetDateTime;
use uuid::Uuid;

use crate::models::order_item::{OrderItem, UpdateOrderItemDto};

pub struct OrderItemRepository {
    pool: PgPool,
}

impl OrderItemRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // Helper method to map a database row to an OrderItem
    fn map_row_to_order_item(row: sqlx::postgres::PgRow) -> Result<OrderItem, Error> {
        let created_at_offset: OffsetDateTime = row.try_get("created_at")?;
        let updated_at_offset: OffsetDateTime = row.try_get("updated_at")?;

        // Convert from time::OffsetDateTime to chrono::DateTime<Utc>
        let created_at = DateTime::<Utc>::from_utc(
            chrono::NaiveDateTime::from_timestamp_opt(
                created_at_offset.unix_timestamp(),
                created_at_offset.nanosecond() as u32,
            )
            .unwrap_or_default(),
            Utc,
        );

        let updated_at = DateTime::<Utc>::from_utc(
            chrono::NaiveDateTime::from_timestamp_opt(
                updated_at_offset.unix_timestamp(),
                updated_at_offset.nanosecond() as u32,
            )
            .unwrap_or_default(),
            Utc,
        );

        Ok(OrderItem {
            id: row.try_get("id")?,
            order_id: row.try_get("order_id")?,
            product_id: row.try_get("product_id")?,
            sku: row.try_get("sku")?,
            name: row.try_get("name")?,
            quantity: row.try_get("quantity")?,
            unit_price: row.try_get("unit_price")?,
            total_price: row.try_get("total_price")?,
            created_at,
            updated_at,
        })
    }

    pub async fn find_all(&self, limit: i64, offset: i64) -> Result<Vec<OrderItem>, Error> {
        let row_results = sqlx::query(
            r#"
            SELECT * FROM order_items
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut items = Vec::new();
        for row in row_results {
            items.push(Self::map_row_to_order_item(row)?);
        }

        Ok(items)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<OrderItem>, Error> {
        let row_result = sqlx::query(
            r#"
            SELECT * FROM order_items
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match row_result {
            Some(row) => Ok(Some(Self::map_row_to_order_item(row)?)),
            None => Ok(None),
        }
    }

    pub async fn find_by_order_id(&self, order_id: Uuid) -> Result<Vec<OrderItem>, Error> {
        let row_results = sqlx::query(
            r#"
            SELECT * FROM order_items
            WHERE order_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(order_id)
        .fetch_all(&self.pool)
        .await?;

        let mut items = Vec::new();
        for row in row_results {
            items.push(Self::map_row_to_order_item(row)?);
        }

        Ok(items)
    }

    pub async fn find_by_product_id(&self, product_id: &str) -> Result<Vec<OrderItem>, Error> {
        let row_results = sqlx::query(
            r#"
            SELECT * FROM order_items
            WHERE product_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(product_id)
        .fetch_all(&self.pool)
        .await?;

        let mut items = Vec::new();
        for row in row_results {
            items.push(Self::map_row_to_order_item(row)?);
        }

        Ok(items)
    }

    pub async fn find_by_sku(&self, sku: &str) -> Result<Vec<OrderItem>, Error> {
        let row_results = sqlx::query(
            r#"
            SELECT * FROM order_items
            WHERE sku = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(sku)
        .fetch_all(&self.pool)
        .await?;

        let mut items = Vec::new();
        for row in row_results {
            items.push(Self::map_row_to_order_item(row)?);
        }

        Ok(items)
    }

    pub async fn update(
        &self,
        id: Uuid,
        dto: UpdateOrderItemDto,
    ) -> Result<Option<OrderItem>, Error> {
        let current = self.find_by_id(id).await?;
        if current.is_none() {
            return Ok(None);
        }

        let current = current.unwrap();
        let quantity = dto.quantity.unwrap_or(current.quantity);
        let total_price = &current.unit_price * BigDecimal::try_from(quantity).unwrap();

        let row_result = sqlx::query(
            r#"
            UPDATE order_items
            SET
                quantity = $1,
                total_price = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
            "#,
        )
        .bind(quantity)
        .bind(total_price)
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match row_result {
            Some(row) => Ok(Some(Self::map_row_to_order_item(row)?)),
            None => Ok(None),
        }
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM order_items
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn count(&self) -> Result<i64, Error> {
        let result = sqlx::query!(
            r#"
            SELECT COUNT(*) as count FROM order_items
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    pub async fn count_by_order_id(&self, order_id: Uuid) -> Result<i64, Error> {
        let result = sqlx::query!(
            r#"
            SELECT COUNT(*) as count FROM order_items
            WHERE order_id = $1
            "#,
            order_id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    pub async fn get_total_for_order(&self, order_id: Uuid) -> Result<BigDecimal, Error> {
        let result = sqlx::query!(
            r#"
            SELECT SUM(total_price) as total FROM order_items
            WHERE order_id = $1
            "#,
            order_id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.total.unwrap_or_else(|| BigDecimal::from(0)))
    }
}
