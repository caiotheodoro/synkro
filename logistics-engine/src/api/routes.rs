use axum::{
    extract::Request,
    routing::{delete, get, post, put},
    Router,
};
use http::header::{HeaderName, HeaderValue};
use tracing::info;
use uuid::Uuid;

use crate::api::{handlers::customer_handlers, middleware::auth_middleware, SharedState};

use super::handlers::{
    inventory_handlers, order_handlers, payment_handlers, shipping_handlers, warehouse_handlers,
};

pub fn create_router(state: SharedState) -> Router {
    let customer_routes = Router::new()
        .route("/", get(customer_handlers::list_customers))
        .route("/", post(customer_handlers::create_customer))
        .route("/{id}", get(customer_handlers::get_customer))
        .route("/{id}", put(customer_handlers::update_customer))
        .route("/{id}", delete(customer_handlers::delete_customer));

    let warehouse_routes = Router::new()
        .route("/", get(warehouse_handlers::list_warehouses))
        .route("/", post(warehouse_handlers::create_warehouse))
        .route("/{id}", get(warehouse_handlers::get_warehouse))
        .route("/{id}", put(warehouse_handlers::update_warehouse))
        .route("/{id}", delete(warehouse_handlers::delete_warehouse));

    let inventory_routes = Router::new()
        .route("/items", get(inventory_handlers::list_inventory_items))
        .route("/items", post(inventory_handlers::create_inventory_item))
        .route("/items/{id}", get(inventory_handlers::get_inventory_item))
        .route(
            "/items/{id}",
            put(inventory_handlers::update_inventory_item),
        )
        .route(
            "/items/{id}",
            delete(inventory_handlers::delete_inventory_item),
        )
        .route(
            "/items/{id}/adjust",
            put(inventory_handlers::adjust_quantity),
        );
    /* .route("/reservations", get(inventory_handlers::list_reservations))
    .route(
        "/reservations",
        post(inventory_handlers::create_reservation),
    )
    .route(
        "/reservations/:id",
        get(inventory_handlers::get_reservation),
    )
    .route(
        "/reservations/:id",
        put(inventory_handlers::update_reservation),
    )
    .route(
        "/reservations/:id",
        delete(inventory_handlers::delete_reservation),
    )
    .route(
        "/reservations/:id/status",
        put(inventory_handlers::update_reservation_status),
    );*/

    let order_routes = Router::new()
        .route("/", get(order_handlers::list_orders))
        .route("/", post(order_handlers::create_order))
        .route("/{id}", get(order_handlers::get_order))
        .route("/{id}", put(order_handlers::update_order))
        .route("/{id}/status", put(order_handlers::update_order_status));
    /*  .route("/:id/items", get(order_handlers::get_order_items))
    .route(
        "/:id/items/:item_id",
        put(order_handlers::update_order_item),
    )
    .route(
        "/:id/items/:item_id",
        delete(order_handlers::delete_order_item),
    );*/

    let payment_routes = Router::new()
        .route("/", get(payment_handlers::list_payments))
        .route("/", post(payment_handlers::create_payment))
        .route("/{id}", get(payment_handlers::get_payment))
        .route("/{id}", put(payment_handlers::update_payment))
        .route("/{id}", delete(payment_handlers::delete_payment))
        .route("/{id}/process", post(payment_handlers::process_payment))
        .route("/{id}/refund", post(payment_handlers::refund_payment));

    let shipping_routes = Router::new()
        .route("/", get(shipping_handlers::list_shipments))
        .route("/", post(shipping_handlers::create_shipment))
        .route("/{id}", get(shipping_handlers::get_shipment))
        .route("/{id}", put(shipping_handlers::update_shipment))
        .route("/{id}", delete(shipping_handlers::delete_shipment))
        .route(
            "/{id}/status",
            put(shipping_handlers::update_shipment_status),
        )
        .route("/{id}/deliver", post(shipping_handlers::mark_as_delivered))
        .route(
            "/tracking/{number}",
            get(shipping_handlers::get_shipment_by_tracking),
        );

    // Build the router
    Router::new()
        .route("/api/health", get(|| async { "OK" }))
        // Protected routes with auth
        .nest(
            "/api/customers",
            customer_routes.route_layer(axum::middleware::from_fn(auth_middleware)),
        )
        .nest(
            "/api/warehouses",
            warehouse_routes.route_layer(axum::middleware::from_fn(auth_middleware)),
        )
        .nest(
            "/api/inventory",
            inventory_routes.route_layer(axum::middleware::from_fn(auth_middleware)),
        )
        .nest(
            "/api/orders",
            order_routes.route_layer(axum::middleware::from_fn(auth_middleware)),
        )
        .nest(
            "/api/payments",
            payment_routes.route_layer(axum::middleware::from_fn(auth_middleware)),
        )
        .nest(
            "/api/shipping",
            shipping_routes.route_layer(axum::middleware::from_fn(auth_middleware)),
        )
        // Global middleware
        .layer(axum::middleware::map_response(|response| async {
            info!("Request completed with response");
            response
        }))
        .layer(axum::middleware::map_request(
            |mut request: Request| async move {
                let request_id = Uuid::new_v4().to_string();
                if let Ok(value) = HeaderValue::from_str(&request_id) {
                    request
                        .headers_mut()
                        .insert(HeaderName::from_static("x-request-id"), value);
                }
                info!("Request received with ID: {}", request_id);
                request
            },
        ))
        .with_state(state)
}
