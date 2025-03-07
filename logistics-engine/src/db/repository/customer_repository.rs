use chrono::{DateTime, TimeZone, Utc};
use sqlx::{types::time::OffsetDateTime, Error, PgPool, Row};
use uuid::Uuid;

use crate::models::{
    dto::customer::{CreateCustomerDto, UpdateCustomerDto},
    entities::customer::Customer,
};

pub struct CustomerRepository {
    pool: PgPool,
}

impl CustomerRepository {
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

    pub async fn find_all(&self, limit: i64, offset: i64) -> Result<Vec<Customer>, Error> {
        println!("limit: {:?}", limit);
        sqlx::query!(
            r#"
            SELECT id, name, email, phone, created_at, updated_at
            FROM customers
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
                .map(|row| Customer {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    created_at: Self::convert_datetime(row.created_at),
                    updated_at: Self::convert_datetime(row.updated_at),
                })
                .collect()
        })
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Customer>, Error> {
        sqlx::query!(
            r#"
            SELECT id, name, email, phone, created_at, updated_at
            FROM customers
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| Customer {
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<Customer>, Error> {
        sqlx::query!(
            r#"
            SELECT id, name, email, phone, created_at, updated_at
            FROM customers
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(&self.pool)
        .await
        .map(|opt| {
            opt.map(|row| Customer {
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                created_at: Self::convert_datetime(row.created_at),
                updated_at: Self::convert_datetime(row.updated_at),
            })
        })
    }

    pub async fn create(&self, dto: CreateCustomerDto) -> Result<Customer, Error> {
        sqlx::query!(
            r#"
            INSERT INTO customers (name, email, phone)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, phone, created_at, updated_at
            "#,
            dto.name,
            dto.email,
            dto.phone
        )
        .fetch_one(&self.pool)
        .await
        .map(|row| Customer {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            created_at: Self::convert_datetime(row.created_at),
            updated_at: Self::convert_datetime(row.updated_at),
        })
    }

    pub async fn update(
        &self,
        id: Uuid,
        dto: UpdateCustomerDto,
    ) -> Result<Option<Customer>, Error> {
        let current = self.find_by_id(id).await?;
        if current.is_none() {
            return Ok(None);
        }

        let updated_customer = sqlx::query!(
            r#"
            UPDATE customers
            SET
                name = COALESCE($1, name),
                email = COALESCE($2, email),
                phone = COALESCE($3, phone),
                updated_at = NOW()
            WHERE id = $4
            RETURNING id, name, email, phone, created_at, updated_at
            "#,
            dto.name,
            dto.email,
            dto.phone,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(updated_customer.map(|row| Customer {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            created_at: Self::convert_datetime(row.created_at),
            updated_at: Self::convert_datetime(row.updated_at),
        }))
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM customers
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
            SELECT COUNT(*) as count FROM customers
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    pub async fn search_customers(
        &self,
        search_term: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Customer>, Error> {
        println!("search_term: {:?}", search_term);
        let search_pattern = format!("%{}%", search_term);

        let rows = sqlx::query(
            r#"
            SELECT id, name, email, phone, created_at, updated_at
            FROM customers
            WHERE id::text ILIKE $1
            OR name ILIKE $1
            OR email ILIKE $1
            OR phone ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(search_pattern)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut customers = Vec::with_capacity(rows.len());
        for row in rows {
            customers.push(Customer {
                id: row.try_get("id")?,
                name: row.try_get("name")?,
                email: row.try_get("email")?,
                phone: row.try_get("phone")?,
                created_at: Self::convert_datetime(row.try_get("created_at")?),
                updated_at: Self::convert_datetime(row.try_get("updated_at")?),
            });
        }
        Ok(customers)
    }
}
