use chrono::{DateTime, TimeZone, Utc};
use rust_decimal::{prelude::FromPrimitive, Decimal};
use sqlx::{
    types::{time::OffsetDateTime, BigDecimal},
    Error, PgPool,
};
use std::str::FromStr;
use uuid::Uuid;

use crate::models::{
    dto::order::{CreateOrderDto, UpdateOrderDto},
    entities::order::{Order, OrderStatus},
};

pub struct OrderRepository {
    pool: PgPool,
}

impl OrderRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn convert_datetime(dt: OffsetDateTime) -> DateTime<Utc> {
        let timestamp = dt.unix_timestamp();
        let nsecs = dt.nanosecond();
        match Utc.timestamp_opt(timestamp, nsecs) {
            chrono::LocalResult::Single(dt) => dt,
            _ => Utc::now(),
        }
    }

    pub async fn find_all(&self, limit: i64, offset: i64) -> Result<Vec<Order>, Error> {
        sqlx::query!(
            r#"
            SELECT 
                id, 
                customer_id, 
                total_amount as "total_amount!: BigDecimal", 
                status as "status!: OrderStatus",
                currency,
                tracking_number,
                notes,
                created_at, 
                updated_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT $1
            OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map(|rows| {
            rows.into_iter()
                .map(|row| Order {
                    id: row.id,
                    customer_id: row.customer_id,
                    total_amount: Decimal::from_str(&row.total_amount.to_string())
                        .unwrap_or_default(),
                    status: row.status,
                    currency: row.currency,
                    tracking_number: row.tracking_number,
                    notes: row.notes,
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Order>, Error> {
        sqlx::query!(
            r#"
            SELECT 
                id, 
                customer_id, 
                total_amount as "total_amount!: BigDecimal", 
                status as "status!: OrderStatus",
                currency,
                tracking_number,
                notes,
                created_at, 
                updated_at
            FROM orders
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| Order {
                id: row.id,
                customer_id: row.customer_id,
                total_amount: Decimal::from_str(&row.total_amount.to_string()).unwrap_or_default(),
                status: row.status,
                currency: row.currency,
                tracking_number: row.tracking_number,
                notes: row.notes,
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn find_by_customer_id(
        &self,
        customer_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Order>, Error> {
        sqlx::query!(
            r#"
            SELECT 
                id, 
                customer_id, 
                total_amount as "total_amount!: BigDecimal", 
                status as "status!: OrderStatus",
                currency,
                tracking_number,
                notes,
                created_at, 
                updated_at
            FROM orders
            WHERE customer_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            OFFSET $3
            "#,
            customer_id,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map(|rows| {
            rows.into_iter()
                .map(|row| Order {
                    id: row.id,
                    customer_id: row.customer_id,
                    total_amount: Decimal::from_str(&row.total_amount.to_string())
                        .unwrap_or_default(),
                    status: row.status,
                    currency: row.currency,
                    tracking_number: row.tracking_number,
                    notes: row.notes,
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn create(&self, dto: CreateOrderDto) -> Result<Order, Error> {
        let currency = if dto.currency.is_empty() {
            "USD".to_string()
        } else {
            dto.currency
        };
        let status = OrderStatus::Pending;

        // Calculate total amount from items
        let total_amount = dto.items.iter().fold(Decimal::ZERO, |acc, item| {
            acc + (Decimal::from_f64_retain(item.unit_price).unwrap_or_default()
                * Decimal::from(item.quantity))
        });

        let customer_id = Uuid::parse_str(&dto.customer_id)
            .map_err(|e| Error::Protocol(format!("Invalid UUID format for customer_id: {}", e)))?;

        sqlx::query!(
            r#"
            INSERT INTO orders (
                customer_id, 
                total_amount, 
                status,
                currency,
                notes
            )
            VALUES ($1, $2, $3, $4, $5)
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
            customer_id,
            BigDecimal::from_str(&total_amount.to_string()).unwrap_or_default(),
            status as OrderStatus,
            currency,
            dto.notes
        )
        .fetch_one(&self.pool)
        .await
        .map(|row| Order {
            id: row.id,
            customer_id: row.customer_id,
            total_amount: Decimal::from_str(&row.total_amount.to_string()).unwrap_or_default(),
            status: row.status,
            currency: row.currency,
            tracking_number: row.tracking_number,
            notes: row.notes,
            created_at: Self::convert_datetime(row.created_at),
            updated_at: Self::convert_datetime(row.updated_at),
        })
    }

    pub async fn update(&self, id: Uuid, dto: UpdateOrderDto) -> Result<Option<Order>, Error> {
        let current = self.find_by_id(id).await?;
        if current.is_none() {
            return Ok(None);
        }

        let status = dto.status.as_ref().map(|s| match s.as_str() {
            "pending" => OrderStatus::Pending,
            "processing" => OrderStatus::Processing,
            "shipped" => OrderStatus::Shipped,
            "delivered" => OrderStatus::Delivered,
            "cancelled" => OrderStatus::Cancelled,
            "returned" => OrderStatus::Returned,
            _ => OrderStatus::Pending,
        });

        sqlx::query!(
            r#"
            UPDATE orders
            SET
                status = COALESCE($1, status),
                tracking_number = COALESCE($2, tracking_number),
                notes = COALESCE($3, notes),
                updated_at = NOW()
            WHERE id = $4
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
            status as Option<OrderStatus>,
            dto.tracking_number,
            dto.notes,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| Order {
                id: row.id,
                customer_id: row.customer_id,
                total_amount: Decimal::from_str(&row.total_amount.to_string()).unwrap_or_default(),
                status: row.status,
                currency: row.currency,
                tracking_number: row.tracking_number,
                notes: row.notes,
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM orders
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn count_by_status(
        &self,
        status: Option<OrderStatus>,
    ) -> Result<Vec<(OrderStatus, i64)>, Error> {
        match status {
            Some(status) => sqlx::query!(
                r#"
                    SELECT status as "status!: OrderStatus", COUNT(*) as "count!: i64"
                    FROM orders
                    WHERE status = $1
                    GROUP BY status
                    "#,
                status as OrderStatus
            )
            .fetch_all(&self.pool)
            .await
            .map(|rows| {
                rows.into_iter()
                    .map(|row| (row.status, row.count))
                    .collect()
            }),
            None => sqlx::query!(
                r#"
                    SELECT status as "status!: OrderStatus", COUNT(*) as "count!: i64"
                    FROM orders
                    GROUP BY status
                    ORDER BY status
                    "#
            )
            .fetch_all(&self.pool)
            .await
            .map(|rows| {
                rows.into_iter()
                    .map(|row| (row.status, row.count))
                    .collect()
            }),
        }
    }

    pub async fn count(&self) -> Result<i64, Error> {
        sqlx::query!(
            r#"
            SELECT COUNT(*) as "count!: i64"
            FROM orders
            "#
        )
        .fetch_one(&self.pool)
        .await
        .map(|row| row.count)
    }
}
