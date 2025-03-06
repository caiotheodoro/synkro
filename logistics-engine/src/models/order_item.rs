use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{types::BigDecimal, FromRow};
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct OrderItem {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    #[sqlx(rename = "unit_price")]
    pub unit_price: BigDecimal,
    #[sqlx(rename = "total_price")]
    pub total_price: BigDecimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Implement custom Serialize for OrderItem
impl Serialize for OrderItem {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;

        let mut state = serializer.serialize_struct("OrderItem", 10)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("order_id", &self.order_id)?;
        state.serialize_field("product_id", &self.product_id)?;
        state.serialize_field("sku", &self.sku)?;
        state.serialize_field("name", &self.name)?;
        state.serialize_field("quantity", &self.quantity)?;

        // Convert BigDecimal to String for serialization
        state.serialize_field("unit_price", &self.unit_price.to_string())?;
        state.serialize_field("total_price", &self.total_price.to_string())?;

        state.serialize_field("created_at", &self.created_at)?;
        state.serialize_field("updated_at", &self.updated_at)?;
        state.end()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateOrderItemDto {
    pub quantity: Option<i32>,
}

#[derive(Debug, Clone)]
pub struct CreateOrderItemDto {
    pub product_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: BigDecimal,
}

// Implement custom Serialize for CreateOrderItemDto
impl Serialize for CreateOrderItemDto {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;

        let mut state = serializer.serialize_struct("CreateOrderItemDto", 5)?;
        state.serialize_field("product_id", &self.product_id)?;
        state.serialize_field("sku", &self.sku)?;
        state.serialize_field("name", &self.name)?;
        state.serialize_field("quantity", &self.quantity)?;

        // Convert BigDecimal to String for serialization
        state.serialize_field("unit_price", &self.unit_price.to_string())?;
        state.end()
    }
}
