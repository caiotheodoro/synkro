use chrono::{DateTime, TimeZone, Utc};
use sqlx::{types::time::OffsetDateTime, Error, PgPool, Row};
use uuid::Uuid;

use crate::models::warehouse::{CreateWarehouseDto, UpdateWarehouseDto, Warehouse};

pub struct WarehouseRepository {
    pool: PgPool,
}

impl WarehouseRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn convert_datetime(dt: OffsetDateTime) -> DateTime<Utc> {
        let timestamp = dt.unix_timestamp();
        let nsecs = dt.nanosecond();
        match DateTime::from_timestamp(timestamp, nsecs) {
            Some(dt) => dt,
            None => Utc::now(),
        }
    }

    fn convert_optional_datetime(dt: Option<OffsetDateTime>) -> Option<DateTime<Utc>> {
        dt.map(Self::convert_datetime)
    }

    fn map_row_to_warehouse(row: sqlx::postgres::PgRow) -> Result<Warehouse, Error> {
        Ok(Warehouse {
            id: row.get("id"),
            code: row.get("code"),
            name: row.get("name"),
            address_line1: row.get("address_line1"),
            address_line2: row.get("address_line2"),
            city: row.get("city"),
            state: row.get("state"),
            postal_code: row.get("postal_code"),
            country: row.get("country"),
            contact_name: row.get("contact_name"),
            contact_phone: row.get("contact_phone"),
            contact_email: row.get("contact_email"),
            active: row.get("active"),
            created_at: Self::convert_datetime(row.get("created_at")),
            updated_at: Self::convert_datetime(row.get("updated_at")),
        })
    }

    pub async fn find_all(&self, limit: i64, offset: i64) -> Result<Vec<Warehouse>, Error> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            FROM warehouses
            ORDER BY name ASC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut warehouses = Vec::with_capacity(rows.len());
        for row in rows {
            warehouses.push(Self::map_row_to_warehouse(row)?);
        }
        Ok(warehouses)
    }

    pub async fn find_active(&self, limit: i64, offset: i64) -> Result<Vec<Warehouse>, Error> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            FROM warehouses
            WHERE active = true
            ORDER BY name ASC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut warehouses = Vec::with_capacity(rows.len());
        for row in rows {
            warehouses.push(Self::map_row_to_warehouse(row)?);
        }
        Ok(warehouses)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Warehouse>, Error> {
        let row = sqlx::query(
            r#"
            SELECT
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            FROM warehouses
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => Ok(Some(Self::map_row_to_warehouse(row)?)),
            None => Ok(None),
        }
    }

    pub async fn find_by_code(&self, code: &str) -> Result<Option<Warehouse>, Error> {
        let row = sqlx::query(
            r#"
            SELECT
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            FROM warehouses
            WHERE code = $1
            "#,
        )
        .bind(code)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => Ok(Some(Self::map_row_to_warehouse(row)?)),
            None => Ok(None),
        }
    }

    pub async fn find_by_city(
        &self,
        city: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Warehouse>, Error> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            FROM warehouses
            WHERE city ILIKE $1
            ORDER BY name ASC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(format!("%{}%", city))
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut warehouses = Vec::with_capacity(rows.len());
        for row in rows {
            warehouses.push(Self::map_row_to_warehouse(row)?);
        }
        Ok(warehouses)
    }

    pub async fn find_by_country(
        &self,
        country: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Warehouse>, Error> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            FROM warehouses
            WHERE country = $1
            ORDER BY name ASC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(country)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut warehouses = Vec::with_capacity(rows.len());
        for row in rows {
            warehouses.push(Self::map_row_to_warehouse(row)?);
        }
        Ok(warehouses)
    }

    pub async fn create(&self, dto: CreateWarehouseDto) -> Result<Warehouse, Error> {
        let row = sqlx::query(
            r#"
            INSERT INTO warehouses
            (code, name, address_line1, address_line2, city, state, postal_code, country, contact_name, contact_phone, contact_email, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            "#,
        )
        .bind(dto.code)
        .bind(dto.name)
        .bind(dto.address_line1)
        .bind(dto.address_line2)
        .bind(dto.city)
        .bind(dto.state)
        .bind(dto.postal_code)
        .bind(dto.country)
        .bind(dto.contact_name)
        .bind(dto.contact_phone)
        .bind(dto.contact_email)
        .bind(dto.active.unwrap_or(true))
        .fetch_one(&self.pool)
        .await?;

        Self::map_row_to_warehouse(row)
    }

    pub async fn update(
        &self,
        id: Uuid,
        dto: UpdateWarehouseDto,
    ) -> Result<Option<Warehouse>, Error> {
        let current = match self.find_by_id(id).await? {
            Some(warehouse) => warehouse,
            None => return Ok(None),
        };

        let row = sqlx::query(
            r#"
            UPDATE warehouses
            SET
                name = $1,
                code = $2,
                address_line1 = $3,
                address_line2 = $4,
                city = $5,
                state = $6,
                postal_code = $7,
                country = $8,
                contact_name = $9,
                contact_phone = $10,
                contact_email = $11,
                active = $12,
                updated_at = NOW()
            WHERE id = $13
            RETURNING
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            "#,
        )
        .bind(dto.name.unwrap_or(current.name))
        .bind(dto.code.unwrap_or(current.code))
        .bind(dto.address_line1.unwrap_or(current.address_line1))
        .bind(
            dto.address_line2
                .unwrap_or_else(|| current.address_line2.unwrap_or_default()),
        )
        .bind(dto.city.unwrap_or(current.city))
        .bind(dto.state.unwrap_or(current.state))
        .bind(dto.postal_code.unwrap_or(current.postal_code))
        .bind(dto.country.unwrap_or(current.country))
        .bind(
            dto.contact_name
                .unwrap_or_else(|| current.contact_name.clone().unwrap_or_default()),
        )
        .bind(
            dto.contact_phone
                .unwrap_or_else(|| current.contact_phone.clone().unwrap_or_default()),
        )
        .bind(
            dto.contact_email
                .unwrap_or_else(|| current.contact_email.clone().unwrap_or_default()),
        )
        .bind(dto.active.unwrap_or(current.active))
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(Some(Self::map_row_to_warehouse(row)?))
    }

    pub async fn set_active(&self, id: Uuid, active: bool) -> Result<Option<Warehouse>, Error> {
        let row = sqlx::query(
            r#"
            UPDATE warehouses
            SET active = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING
                id, code, name,
                address_line1, address_line2,
                city, state, postal_code, country,
                contact_name, contact_phone, contact_email,
                active, created_at, updated_at
            "#,
        )
        .bind(active)
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => Ok(Some(Self::map_row_to_warehouse(row)?)),
            None => Ok(None),
        }
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query("DELETE FROM warehouses WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn count(&self) -> Result<i64, Error> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM warehouses")
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get::<i64, _>("count"))
    }

    pub async fn count_active(&self) -> Result<i64, Error> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM warehouses WHERE active = true")
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get::<i64, _>("count"))
    }

    pub async fn count_by_country(&self, country: &str) -> Result<i64, Error> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM warehouses WHERE country = $1")
            .bind(country)
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get::<i64, _>("count"))
    }

    pub async fn search_warehouses(
        &self,
        search_term: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Warehouse>, Error> {
        let search_pattern = format!("%{}%", search_term);

        let rows = sqlx::query(
            r#"
            SELECT *
            FROM warehouses
            WHERE id::text ILIKE $1
            OR name ILIKE $1
            OR code ILIKE $1
            OR address_line1 ILIKE $1
            OR city ILIKE $1
            OR state ILIKE $1
            OR postal_code ILIKE $1
            OR country ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(search_pattern)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut warehouses = Vec::with_capacity(rows.len());
        for row in rows {
            warehouses.push(Self::map_row_to_warehouse(row)?);
        }
        Ok(warehouses)
    }
}
