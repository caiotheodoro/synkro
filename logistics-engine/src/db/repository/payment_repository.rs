use chrono::{DateTime, TimeZone, Utc};
use num_traits::ToPrimitive;
use rust_decimal::{prelude::FromPrimitive, Decimal};
use sqlx::{
    types::{time::OffsetDateTime, BigDecimal},
    Error, PgPool,
};
use std::str::FromStr;
use uuid::Uuid;

use crate::models::{
    dto::payment::{CreatePaymentInfoDto, UpdatePaymentInfoDto},
    entities::payment_info::PaymentInfo,
    payment::PaymentStatus,
};

pub struct PaymentRepository {
    pool: PgPool,
}

impl PaymentRepository {
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

    fn convert_optional_datetime(dt: Option<OffsetDateTime>) -> Option<DateTime<Utc>> {
        dt.map(|dt| Self::convert_datetime(dt))
    }

    pub async fn find_all(&self, limit: i64, offset: i64) -> Result<Vec<PaymentInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT 
                id, 
                order_id,
                amount as "amount!: BigDecimal",
                currency,
                status as "status_str!: String",
                payment_method,
                transaction_id,
                payment_date,
                created_at,
                updated_at
            FROM payment_info
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
                .map(|row| PaymentInfo {
                    id: row.id,
                    order_id: row.order_id,
                    amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
                    currency: row.currency,
                    status_str: row.status_str,
                    payment_method: row.payment_method,
                    transaction_id: row.transaction_id,
                    payment_date: Self::convert_optional_datetime(row.payment_date),
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<PaymentInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT 
                id, 
                order_id,
                amount as "amount!: BigDecimal",
                currency,
                status as "status_str!: String",
                payment_method,
                transaction_id,
                payment_date,
                created_at,
                updated_at
            FROM payment_info
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| PaymentInfo {
                id: row.id,
                order_id: row.order_id,
                amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
                currency: row.currency,
                status_str: row.status_str,
                payment_method: row.payment_method,
                transaction_id: row.transaction_id,
                payment_date: Self::convert_optional_datetime(row.payment_date),
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn find_by_order_id(&self, order_id: Uuid) -> Result<Vec<PaymentInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT 
                id, 
                order_id,
                amount as "amount!: BigDecimal",
                currency,
                status as "status_str!: String",
                payment_method,
                transaction_id,
                payment_date,
                created_at,
                updated_at
            FROM payment_info
            WHERE order_id = $1
            ORDER BY created_at DESC
            "#,
            order_id
        )
        .fetch_all(&self.pool)
        .await
        .map(|rows| {
            rows.into_iter()
                .map(|row| PaymentInfo {
                    id: row.id,
                    order_id: row.order_id,
                    amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
                    currency: row.currency,
                    status_str: row.status_str,
                    payment_method: row.payment_method,
                    transaction_id: row.transaction_id,
                    payment_date: Self::convert_optional_datetime(row.payment_date),
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn find_by_customer_id(
        &self,
        customer_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<PaymentInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT
                p.id, p.order_id, p.payment_method, p.transaction_id,
                p.amount as "amount!: BigDecimal", p.currency, p.status as "status_str!: String", p.payment_date,
                p.created_at, p.updated_at
            FROM payment_info p
            JOIN orders o ON p.order_id = o.id
            WHERE o.customer_id = $1
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            customer_id,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map(|rows| {
            rows.into_iter()
                .map(|row| PaymentInfo {
                    id: row.id,
                    order_id: row.order_id,
                    payment_method: row.payment_method,
                    transaction_id: row.transaction_id,
                    amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
                    currency: row.currency,
                    status_str: row.status_str,
                    payment_date: Self::convert_optional_datetime(row.payment_date),
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn find_by_status(
        &self,
        status: PaymentStatus,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<PaymentInfo>, Error> {
        let status_str = status.as_str();

        sqlx::query!(
            r#"
            SELECT
                id, order_id, payment_method, transaction_id,
                amount as "amount!: BigDecimal", currency, status as "status_str!: String", payment_date,
                created_at, updated_at
            FROM payment_info
            WHERE status = $1
            ORDER BY created_at DESC
            LIMIT $2
            OFFSET $3
            "#,
            status_str,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map(|rows| {
            rows.into_iter()
                .map(|row| PaymentInfo {
                    id: row.id,
                    order_id: row.order_id,
                    payment_method: row.payment_method,
                    transaction_id: row.transaction_id,
                    amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
                    currency: row.currency,
                    status_str: row.status_str,
                    payment_date: Self::convert_optional_datetime(row.payment_date),
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn create(&self, dto: CreatePaymentInfoDto) -> Result<PaymentInfo, Error> {
        let currency = if dto.currency.is_empty() {
            "USD".to_string()
        } else {
            dto.currency
        };
        let status_str = PaymentStatus::Pending.as_str();

        let amount_decimal = BigDecimal::from_f64(dto.amount)
            .ok_or_else(|| Error::Protocol("Failed to convert amount to BigDecimal".into()))?;

        sqlx::query!(
            r#"
            INSERT INTO payment_info(
                order_id, payment_method, transaction_id, amount, currency, status, payment_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING 
                id, order_id, payment_method, transaction_id, 
                amount as "amount!: BigDecimal", 
                currency, 
                status as "status_str!: String", 
                payment_date, created_at, updated_at
            "#,
            dto.order_id,
            dto.payment_method,
            dto.transaction_id,
            amount_decimal,
            currency,
            status_str,
            None::<OffsetDateTime>,
        )
        .fetch_one(&self.pool)
        .await
        .map(|row| PaymentInfo {
            id: row.id,
            order_id: row.order_id,
            payment_method: row.payment_method,
            transaction_id: row.transaction_id,
            amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
            currency: row.currency,
            status_str: row.status_str,
            payment_date: Self::convert_optional_datetime(row.payment_date),
            created_at: Self::convert_datetime(row.created_at),
            updated_at: Self::convert_datetime(row.updated_at),
        })
    }

    pub async fn update_status(
        &self,
        id: Uuid,
        status: PaymentStatus,
    ) -> Result<Option<PaymentInfo>, Error> {
        let status_str = status.as_str();

        sqlx::query!(
            r#"
            UPDATE payment_info
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING
                id, order_id, payment_method, transaction_id,
                amount as "amount!: BigDecimal", currency, status as "status_str!: String", payment_date,
                created_at, updated_at
            "#,
            status_str,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| PaymentInfo {
                id: row.id,
                order_id: row.order_id,
                payment_method: row.payment_method,
                transaction_id: row.transaction_id,
                amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
                currency: row.currency,
                status_str: row.status_str,
                payment_date: Self::convert_optional_datetime(row.payment_date),
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn update(
        &self,
        id: Uuid,
        dto: UpdatePaymentInfoDto,
    ) -> Result<Option<PaymentInfo>, Error> {
        let current = self.find_by_id(id).await?;
        if current.is_none() {
            return Ok(None);
        }

        let current = current.unwrap();
        let status_str = dto.status.as_ref().map(|s| s.as_str()).unwrap_or_else(|| {
            PaymentStatus::from_str(&current.status_str)
                .unwrap_or_default()
                .as_str()
        });

        sqlx::query!(
            r#"
            UPDATE payment_info
            SET
                payment_method = COALESCE($1, payment_method),
                transaction_id = COALESCE($2, transaction_id),
                status = $3,
                updated_at = NOW()
            WHERE id = $4
            RETURNING
                id, order_id, payment_method, transaction_id,
                amount as "amount!: BigDecimal", currency, status as "status_str!: String", payment_date,
                created_at, updated_at
            "#,
            dto.payment_method,
            dto.transaction_id,
            status_str,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| PaymentInfo {
                id: row.id,
                order_id: row.order_id,
                payment_method: row.payment_method,
                transaction_id: row.transaction_id,
                amount: Decimal::from_str(&row.amount.to_string()).unwrap_or_default(),
                currency: row.currency,
                status_str: row.status_str,
                payment_date: Self::convert_optional_datetime(row.payment_date),
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM payment_info
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
            SELECT COUNT(*) as count FROM payment_info
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    pub async fn count_by_status(&self, status: PaymentStatus) -> Result<i64, Error> {
        let status_str = status.as_str();

        let result = sqlx::query!(
            r#"
            SELECT COUNT(*) as count FROM payment_info
            WHERE status = $1
            "#,
            status_str
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    pub async fn get_total_amount_by_status(&self, status: PaymentStatus) -> Result<f64, Error> {
        let status_str = status.as_str();

        let result = sqlx::query!(
            r#"
            SELECT COALESCE(SUM(amount), 0) as "total!: BigDecimal" FROM payment_info
            WHERE status = $1
            "#,
            status_str
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(Decimal::from_str(&result.total.to_string())
            .unwrap_or_default()
            .to_f64()
            .unwrap_or(0.0))
    }
}
