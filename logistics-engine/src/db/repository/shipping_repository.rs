use chrono::{DateTime, TimeZone, Utc};
use rust_decimal::{prelude::FromPrimitive, Decimal};
use sqlx::{
    types::{time::OffsetDateTime, BigDecimal},
    Error, PgPool, Postgres, Row, Transaction,
};
use std::str::FromStr;
use uuid::Uuid;

use crate::models::{
    dto::shipping::{CreateShippingInfoDto, UpdateShippingInfoDto},
    entities::shipping_info::ShippingInfo,
    shipping::ShippingStatus,
};

pub struct ShippingRepository {
    pool: PgPool,
}

impl ShippingRepository {
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
        dt.map(Self::convert_datetime)
    }

    pub async fn find_all(&self, limit: i64, offset: i64) -> Result<Vec<ShippingInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            FROM shipping_info
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map(|rows| {
            rows.into_iter()
                .map(|row| ShippingInfo {
                    id: row.id,
                    order_id: row.order_id,
                    address_line1: row.address_line1,
                    address_line2: row.address_line2,
                    city: row.city,
                    state: row.state,
                    postal_code: row.postal_code,
                    country: row.country,
                    recipient_name: row.recipient_name,
                    recipient_phone: row.recipient_phone,
                    shipping_method: row.shipping_method,
                    shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                    tracking_number: row.tracking_number,
                    carrier: row.carrier,
                    status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                    expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                    actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<ShippingInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            FROM shipping_info
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| ShippingInfo {
                id: row.id,
                order_id: row.order_id,
                address_line1: row.address_line1,
                address_line2: row.address_line2,
                city: row.city,
                state: row.state,
                postal_code: row.postal_code,
                country: row.country,
                recipient_name: row.recipient_name,
                recipient_phone: row.recipient_phone,
                shipping_method: row.shipping_method,
                shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                tracking_number: Some(row.tracking_number.unwrap_or_default()),
                carrier: Some(row.carrier.unwrap_or_default()),
                status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn find_by_order_id(&self, order_id: Uuid) -> Result<Option<ShippingInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            FROM shipping_info
            WHERE order_id = $1
            "#,
            order_id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| ShippingInfo {
                id: row.id,
                order_id: row.order_id,
                address_line1: row.address_line1,
                address_line2: row.address_line2,
                city: row.city,
                state: row.state,
                postal_code: row.postal_code,
                country: row.country,
                recipient_name: row.recipient_name,
                recipient_phone: row.recipient_phone,
                shipping_method: row.shipping_method,
                shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                tracking_number: Some(row.tracking_number.unwrap_or_default()),
                carrier: Some(row.carrier.unwrap_or_default()),
                status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn find_by_tracking_number(
        &self,
        tracking_number: &str,
    ) -> Result<Option<ShippingInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            FROM shipping_info
            WHERE tracking_number = $1
            "#,
            tracking_number
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| ShippingInfo {
                id: row.id,
                order_id: row.order_id,
                address_line1: row.address_line1,
                address_line2: row.address_line2,
                city: row.city,
                state: row.state,
                postal_code: row.postal_code,
                country: row.country,
                recipient_name: row.recipient_name,
                recipient_phone: row.recipient_phone,
                shipping_method: row.shipping_method,
                shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                tracking_number: Some(row.tracking_number.unwrap_or_default()),
                carrier: Some(row.carrier.unwrap_or_default()),
                status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
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
    ) -> Result<Vec<ShippingInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT
                s.id, s.order_id, s.address_line1, s.address_line2, s.city, s.state,
                s.postal_code, s.country, s.recipient_name, s.recipient_phone,
                s.shipping_method, s.shipping_cost as "shipping_cost!: BigDecimal", s.tracking_number, s.carrier, 
                s.status::text as status,
                s.expected_delivery, s.actual_delivery,
                s.created_at, s.updated_at
            FROM shipping_info s
            JOIN orders o ON s.order_id = o.id
            WHERE o.customer_id = $1
            ORDER BY s.created_at DESC
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
                .map(|row| ShippingInfo {
                    id: row.id,
                    order_id: row.order_id,
                    address_line1: row.address_line1,
                    address_line2: row.address_line2,
                    city: row.city,
                    state: row.state,
                    postal_code: row.postal_code,
                    country: row.country,
                    recipient_name: row.recipient_name,
                    recipient_phone: row.recipient_phone,
                    shipping_method: row.shipping_method,
                    shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                    tracking_number: Some(row.tracking_number.unwrap_or_default()),
                    carrier: Some(row.carrier.unwrap_or_default()),
                    status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                    expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                    actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn find_by_status(
        &self,
        status: ShippingStatus,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<ShippingInfo>, Error> {
        sqlx::query!(
            r#"
            SELECT
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            FROM shipping_info
            WHERE status = $1::shipping_status
            ORDER BY created_at DESC
            LIMIT $2
            OFFSET $3
            "#,
            status as _,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map(|rows| {
            rows.into_iter()
                .map(|row| ShippingInfo {
                    id: row.id,
                    order_id: row.order_id,
                    address_line1: row.address_line1,
                    address_line2: row.address_line2,
                    city: row.city,
                    state: row.state,
                    postal_code: row.postal_code,
                    country: row.country,
                    recipient_name: row.recipient_name,
                    recipient_phone: row.recipient_phone,
                    shipping_method: row.shipping_method,
                    shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                    tracking_number: Some(row.tracking_number.unwrap_or_default()),
                    carrier: Some(row.carrier.unwrap_or_default()   ),
                    status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                    expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                    actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn create(&self, dto: CreateShippingInfoDto) -> Result<ShippingInfo, Error> {
        let shipping_cost = BigDecimal::from_str(
            &Decimal::from_f64(dto.shipping_cost)
                .unwrap_or_default()
                .to_string(),
        )
        .unwrap_or_default();

        sqlx::query!(
            r#"
            INSERT INTO shipping_info
            (order_id, address_line1, address_line2, city, state, postal_code, country, recipient_name, recipient_phone, shipping_method, shipping_cost, status, expected_delivery, actual_delivery)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::shipping_status, $13, $14)
            RETURNING
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            "#,
            dto.order_id,
            dto.address_line1,
            dto.address_line2,
            dto.city,
            dto.state,
            dto.postal_code,
            dto.country,
            dto.recipient_name,
            dto.recipient_phone,
            dto.shipping_method,
            shipping_cost,
            ShippingStatus::Pending as _,
            None::<OffsetDateTime>,
            None::<OffsetDateTime>,
        )
        .fetch_one(&self.pool)
        .await
        .map(|row| ShippingInfo {
            id: row.id,
            order_id: row.order_id,
            address_line1: row.address_line1,
            address_line2: row.address_line2,
            city: row.city,
            state: row.state,
            postal_code: row.postal_code,
            country: row.country,
            recipient_name: row.recipient_name,
            recipient_phone: row.recipient_phone,
            shipping_method: row.shipping_method,
            shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
            tracking_number: Some(row.tracking_number.unwrap_or_default()),
            carrier: Some(row.carrier.unwrap_or_default()),
            status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
            expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
            actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
            created_at: Self::convert_datetime(row.created_at),
            updated_at: Self::convert_datetime(row.updated_at),
        })
    }

    pub async fn update_status(
        &self,
        id: Uuid,
        status: ShippingStatus,
    ) -> Result<Option<ShippingInfo>, Error> {
        sqlx::query!(
            r#"
            UPDATE shipping_info
            SET status = $1::shipping_status, updated_at = NOW()
            WHERE id = $2
            RETURNING
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            "#,
            status as _,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| ShippingInfo {
                id: row.id,
                order_id: row.order_id,
                address_line1: row.address_line1,
                address_line2: row.address_line2,
                city: row.city,
                state: row.state,
                postal_code: row.postal_code,
                country: row.country,
                recipient_name: row.recipient_name,
                recipient_phone: row.recipient_phone,
                shipping_method: row.shipping_method,
                shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                tracking_number: Some(row.tracking_number.unwrap_or_default()),
                carrier: Some(row.carrier.unwrap_or_default()),
                status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn update(
        &self,
        id: Uuid,
        dto: UpdateShippingInfoDto,
    ) -> Result<Option<ShippingInfo>, Error> {
        let current = self.find_by_id(id).await?;
        if current.is_none() {
            return Ok(None);
        }

        let current = current.unwrap();
        let shipping_cost = match dto.shipping_cost {
            Some(cost) => {
                let decimal = Decimal::from_f64(cost).unwrap_or_default();
                BigDecimal::from_str(&decimal.to_string()).unwrap_or_default()
            }
            None => BigDecimal::from_str(&current.shipping_cost.to_string()).unwrap_or_default(),
        };

        sqlx::query!(
            r#"
            UPDATE shipping_info
            SET
                address_line1 = COALESCE($1, address_line1),
                address_line2 = COALESCE($2, address_line2), 
                city = COALESCE($3, city),
                state = COALESCE($4, state),
                postal_code = COALESCE($5, postal_code),
                country = COALESCE($6, country),
                recipient_name = COALESCE($7, recipient_name),
                recipient_phone = COALESCE($8, recipient_phone),
                shipping_method = COALESCE($9, shipping_method),
                shipping_cost = $10,
                updated_at = NOW()
            WHERE id = $11
            RETURNING
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost as "shipping_cost!: BigDecimal", tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            "#,
            dto.address_line1,
            dto.address_line2,
            dto.city,
            dto.state,
            dto.postal_code,
            dto.country,
            dto.recipient_name,
            dto.recipient_phone,
            dto.shipping_method,
            shipping_cost,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| ShippingInfo {
                id: row.id,
                order_id: row.order_id,
                address_line1: row.address_line1,
                address_line2: row.address_line2,
                city: row.city,
                state: row.state,
                postal_code: row.postal_code,
                country: row.country,
                recipient_name: row.recipient_name,
                recipient_phone: row.recipient_phone,
                shipping_method: row.shipping_method,
                shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
                tracking_number: Some(row.tracking_number.unwrap_or_default()),
                carrier: Some(row.carrier.unwrap_or_default()),
                status: row.status.unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
                expected_delivery: Self::convert_optional_datetime(row.expected_delivery),
                actual_delivery: Self::convert_optional_datetime(row.actual_delivery),
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM shipping_info
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
            SELECT COUNT(*) as count FROM shipping_info
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    pub async fn count_by_status(&self, status: ShippingStatus) -> Result<i64, Error> {
        let result = sqlx::query!(
            r#"
            SELECT COUNT(*) as count FROM shipping_info
            WHERE status = $1::shipping_status
            "#,
            status as _
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    pub async fn create_with_transaction(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        dto: CreateShippingInfoDto,
    ) -> Result<ShippingInfo, Error> {
        let shipping_cost_decimal = BigDecimal::from_f64(dto.shipping_cost).ok_or_else(|| {
            Error::Protocol("Failed to convert shipping cost to BigDecimal".into())
        })?;

        sqlx::query!(
            r#"
            INSERT INTO shipping_info(
                order_id, address_line1, address_line2, city, state, postal_code, country,
                recipient_name, recipient_phone, shipping_method, shipping_cost, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::shipping_status)
            RETURNING 
                id, order_id, address_line1, address_line2, city, state, postal_code, country,
                recipient_name, recipient_phone, shipping_method, 
                shipping_cost as "shipping_cost!: BigDecimal",
                status::text as status, carrier, tracking_number,
                created_at, updated_at
            "#,
            dto.order_id,
            dto.address_line1,
            dto.address_line2,
            dto.city,
            dto.state,
            dto.postal_code,
            dto.country,
            dto.recipient_name,
            dto.recipient_phone,
            dto.shipping_method,
            shipping_cost_decimal,
            ShippingStatus::Pending as _,
        )
        .fetch_one(&mut **tx)
        .await
        .map(|row| ShippingInfo {
            id: row.id,
            order_id: row.order_id,
            address_line1: row.address_line1,
            address_line2: row.address_line2,
            city: row.city,
            state: row.state,
            postal_code: row.postal_code,
            country: row.country,
            recipient_name: row.recipient_name,
            recipient_phone: row.recipient_phone,
            shipping_method: row.shipping_method,
            shipping_cost: Decimal::from_str(&row.shipping_cost.to_string()).unwrap_or_default(),
            tracking_number: Some(row.tracking_number.unwrap_or_default()),
            carrier: Some(row.carrier.unwrap_or_default()),
            status: row
                .status
                .unwrap_or_else(|| ShippingStatus::Pending.as_str().to_string()),
            expected_delivery: None,
            actual_delivery: None,
            created_at: Self::convert_datetime(row.created_at),
            updated_at: Self::convert_datetime(row.updated_at),
        })
    }

    pub async fn create_shipping_info(
        &self,
        shipping_info: &ShippingInfo,
    ) -> Result<ShippingInfo, Error> {
        let shipping_cost =
            BigDecimal::from_str(&shipping_info.shipping_cost.to_string()).unwrap_or_default();
        let created_at = OffsetDateTime::from_unix_timestamp(shipping_info.created_at.timestamp())
            .unwrap_or_else(|_| OffsetDateTime::now_utc());
        let updated_at = OffsetDateTime::from_unix_timestamp(shipping_info.updated_at.timestamp())
            .unwrap_or_else(|_| OffsetDateTime::now_utc());
        let expected_delivery = shipping_info.expected_delivery.map(|dt| {
            OffsetDateTime::from_unix_timestamp(dt.timestamp())
                .unwrap_or_else(|_| OffsetDateTime::now_utc())
        });
        let actual_delivery = shipping_info.actual_delivery.map(|dt| {
            OffsetDateTime::from_unix_timestamp(dt.timestamp())
                .unwrap_or_else(|_| OffsetDateTime::now_utc())
        });

        let row = sqlx::query(
            r#"
            INSERT INTO shipping_info (
                id, order_id, address_line1, address_line2, city, state, postal_code, country,
                recipient_name, recipient_phone, shipping_method, shipping_cost, status,
                carrier, tracking_number, expected_delivery, actual_delivery, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::shipping_status, $14, $15, $16, $17, $18, $19)
            RETURNING
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost, tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            "#,
        )
        .bind(shipping_info.id)
        .bind(shipping_info.order_id)
        .bind(&shipping_info.address_line1)
        .bind(&shipping_info.address_line2)
        .bind(&shipping_info.city)
        .bind(&shipping_info.state)
        .bind(&shipping_info.postal_code)
        .bind(&shipping_info.country)
        .bind(&shipping_info.recipient_name)
        .bind(&shipping_info.recipient_phone)
        .bind(&shipping_info.shipping_method)
        .bind(shipping_cost)
        .bind(&shipping_info.status)
        .bind(&shipping_info.carrier)
        .bind(&shipping_info.tracking_number)
        .bind(expected_delivery)
        .bind(actual_delivery)
        .bind(created_at)
        .bind(updated_at)
        .map(|row: sqlx::postgres::PgRow| ShippingInfo {
            id: row.try_get("id").unwrap_or_default(),
            order_id: row.try_get("order_id").unwrap_or_default(),
            address_line1: row.try_get("address_line1").unwrap_or_default(),
            address_line2: row.try_get("address_line2").ok(),
            city: row.try_get("city").unwrap_or_default(),
            state: row.try_get("state").unwrap_or_default(),
            postal_code: row.try_get("postal_code").unwrap_or_default(),
            country: row.try_get("country").unwrap_or_default(),
            recipient_name: row.try_get("recipient_name").unwrap_or_default(),
            recipient_phone: row.try_get("recipient_phone").ok(),
            shipping_method: row.try_get("shipping_method").unwrap_or_default(),
            shipping_cost: Decimal::from_str(&row.try_get::<BigDecimal, _>("shipping_cost").unwrap_or_default().to_string()).unwrap_or_default(),
            tracking_number: Some(row.try_get::<Option<String>, _>("tracking_number").unwrap_or_default().unwrap_or_default()),
            carrier: Some(row.try_get::<Option<String>, _>("carrier").unwrap_or_default().unwrap_or_default()),
            status: row.try_get::<String, _>("status").unwrap_or_else(|_| ShippingStatus::Pending.as_str().to_string()),
            expected_delivery: Self::convert_optional_datetime(row.try_get("expected_delivery").ok()),
            actual_delivery: Self::convert_optional_datetime(row.try_get("actual_delivery").ok()),
            created_at: Self::convert_datetime(row.try_get("created_at").unwrap_or_else(|_| OffsetDateTime::now_utc())),
            updated_at: Self::convert_datetime(row.try_get("updated_at").unwrap_or_else(|_| OffsetDateTime::now_utc())),
        })
        .fetch_one(&self.pool)
        .await?;

        Ok(row)
    }

    pub async fn update_shipping_info(
        &self,
        shipping_info: &ShippingInfo,
    ) -> Result<ShippingInfo, Error> {
        let shipping_cost =
            BigDecimal::from_str(&shipping_info.shipping_cost.to_string()).unwrap_or_default();
        let updated_at = OffsetDateTime::from_unix_timestamp(shipping_info.updated_at.timestamp())
            .unwrap_or_else(|_| OffsetDateTime::now_utc());
        let expected_delivery = shipping_info.expected_delivery.map(|dt| {
            OffsetDateTime::from_unix_timestamp(dt.timestamp())
                .unwrap_or_else(|_| OffsetDateTime::now_utc())
        });
        let actual_delivery = shipping_info.actual_delivery.map(|dt| {
            OffsetDateTime::from_unix_timestamp(dt.timestamp())
                .unwrap_or_else(|_| OffsetDateTime::now_utc())
        });

        let row = sqlx::query(
            r#"
            UPDATE shipping_info
            SET order_id = $2,
                address_line1 = $3,
                address_line2 = $4,
                city = $5,
                state = $6,
                postal_code = $7,
                country = $8,
                recipient_name = $9,
                recipient_phone = $10,
                shipping_method = $11,
                shipping_cost = $12,
                status = $13::shipping_status,
                carrier = $14,
                tracking_number = $15,
                expected_delivery = $16,
                actual_delivery = $17,
                updated_at = $18
            WHERE id = $1
            RETURNING 
                id, order_id, address_line1, address_line2, city, state,
                postal_code, country, recipient_name, recipient_phone,
                shipping_method, shipping_cost, tracking_number, carrier, 
                status::text as status,
                expected_delivery, actual_delivery,
                created_at, updated_at
            "#,
        )
        .bind(shipping_info.id)
        .bind(shipping_info.order_id)
        .bind(&shipping_info.address_line1)
        .bind(&shipping_info.address_line2)
        .bind(&shipping_info.city)
        .bind(&shipping_info.state)
        .bind(&shipping_info.postal_code)
        .bind(&shipping_info.country)
        .bind(&shipping_info.recipient_name)
        .bind(&shipping_info.recipient_phone)
        .bind(&shipping_info.shipping_method)
        .bind(shipping_cost)
        .bind(&shipping_info.status)
        .bind(&shipping_info.carrier)
        .bind(&shipping_info.tracking_number)
        .bind(expected_delivery)
        .bind(actual_delivery)
        .bind(updated_at)
        .map(|row: sqlx::postgres::PgRow| ShippingInfo {
            id: row.try_get("id").unwrap_or_default(),
            order_id: row.try_get("order_id").unwrap_or_default(),
            address_line1: row.try_get("address_line1").unwrap_or_default(),
            address_line2: row.try_get("address_line2").ok(),
            city: row.try_get("city").unwrap_or_default(),
            state: row.try_get("state").unwrap_or_default(),
            postal_code: row.try_get("postal_code").unwrap_or_default(),
            country: row.try_get("country").unwrap_or_default(),
            recipient_name: row.try_get("recipient_name").unwrap_or_default(),
            recipient_phone: row.try_get("recipient_phone").ok(),
            shipping_method: row.try_get("shipping_method").unwrap_or_default(),
            shipping_cost: Decimal::from_str(
                &row.try_get::<BigDecimal, _>("shipping_cost")
                    .unwrap_or_default()
                    .to_string(),
            )
            .unwrap_or_default(),
            tracking_number: Some(
                row.try_get::<Option<String>, _>("tracking_number")
                    .unwrap_or_default()
                    .unwrap_or_default(),
            ),
            carrier: Some(
                row.try_get::<Option<String>, _>("carrier")
                    .unwrap_or_default()
                    .unwrap_or_default(),
            ),
            status: row
                .try_get::<String, _>("status")
                .unwrap_or_else(|_| ShippingStatus::Pending.as_str().to_string()),
            expected_delivery: Self::convert_optional_datetime(
                row.try_get("expected_delivery").ok(),
            ),
            actual_delivery: Self::convert_optional_datetime(row.try_get("actual_delivery").ok()),
            created_at: Self::convert_datetime(
                row.try_get("created_at")
                    .unwrap_or_else(|_| OffsetDateTime::now_utc()),
            ),
            updated_at: Self::convert_datetime(
                row.try_get("updated_at")
                    .unwrap_or_else(|_| OffsetDateTime::now_utc()),
            ),
        })
        .fetch_one(&self.pool)
        .await?;

        Ok(row)
    }
}
