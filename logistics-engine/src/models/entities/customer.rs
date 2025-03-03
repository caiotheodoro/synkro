use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Customer {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Customer {
    pub fn new(name: String, email: String, phone: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            email,
            phone,
            created_at: now,
            updated_at: now,
        }
    }
}
