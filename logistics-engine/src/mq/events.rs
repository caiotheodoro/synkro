use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub enum EventType {
    OrderCreated,
    OrderStatusChanged,
    OrderCancelled,
    InventoryReserved,
    InventoryReleased,
    InventoryUpdated,
    ShipmentCreated,
    ShipmentStatusChanged,
    PaymentProcessed,
    PaymentFailed,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Event<T> {
    pub id: Uuid,
    pub event_type: EventType,
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub data: T,
}

// Order Events

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderCreatedEvent {
    pub order_id: Uuid,
    pub customer_id: Uuid,
    pub status: String,
    pub total_amount: String,
    pub items_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderStatusChangedEvent {
    pub order_id: Uuid,
    pub previous_status: Option<String>,
    pub new_status: String,
    pub changed_by: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderCancelledEvent {
    pub order_id: Uuid,
    pub reason: String,
    pub cancelled_by: Option<String>,
}

// Inventory Events

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryUpdatedEvent {
    pub product_id: Uuid,
    pub sku: String,
    pub previous_quantity: i32,
    pub new_quantity: i32,
    pub warehouse_id: Uuid,
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryReservedEvent {
    pub reservation_id: String,
    pub order_id: Uuid,
    pub items: Vec<ReservedItem>,
    pub warehouse_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReservedItem {
    pub product_id: Uuid,
    pub sku: String,
    pub quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryReleasedEvent {
    pub reservation_id: String,
    pub order_id: Uuid,
    pub reason: String,
}

// Shipment Events

#[derive(Debug, Serialize, Deserialize)]
pub struct ShipmentCreatedEvent {
    pub shipment_id: Uuid,
    pub order_id: Uuid,
    pub tracking_number: String,
    pub carrier: String,
    pub estimated_delivery: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShipmentStatusChangedEvent {
    pub shipment_id: Uuid,
    pub order_id: Uuid,
    pub previous_status: String,
    pub new_status: String,
    pub location: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub notes: Option<String>,
}

// Payment Events

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentProcessedEvent {
    pub payment_id: Uuid,
    pub order_id: Uuid,
    pub amount: String,
    pub currency: String,
    pub payment_method: String,
    pub transaction_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentFailedEvent {
    pub payment_id: Option<Uuid>,
    pub order_id: Uuid,
    pub amount: String,
    pub currency: String,
    pub payment_method: String,
    pub error_code: String,
    pub error_message: String,
}
