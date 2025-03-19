pub mod handlers;
pub mod middleware;
pub mod routes;
pub mod utils;

use axum::Router;
use std::sync::Arc;

use crate::services::{
    AnalyticsService, CustomerService, InventoryService, OrderService, PaymentService,
    ShippingService, WarehouseService,
};

#[derive(Clone)]
pub struct AppState {
    pub customer_service: Arc<CustomerService>,
    pub inventory_service: Arc<InventoryService>,
    pub order_service: Arc<OrderService>,
    pub payment_service: Arc<PaymentService>,
    pub shipping_service: Arc<ShippingService>,
    pub warehouse_service: Arc<WarehouseService>,
    pub analytics_service: Arc<AnalyticsService>,
}

pub type SharedState = Arc<AppState>;

pub async fn create_router(state: SharedState) -> Router {
    routes::create_router(state)
}
