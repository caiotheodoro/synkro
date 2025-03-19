use axum::{
    extract::Path,
    middleware::from_fn,
    routing::{delete, get, post, put},
    Router,
};
use http::header::HeaderName;
use tower_http::cors::CorsLayer;

use crate::api::{handlers::customer_handlers, middleware::auth_middleware, SharedState};

use super::handlers::{
    analytics_handlers, dashboard_handlers, inventory_handlers, order_handlers, payment_handlers,
    shipping_handlers, warehouse_handlers,
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
        .route("/", get(inventory_handlers::list_inventory_items))
        .route("/", post(inventory_handlers::create_inventory_item))
        .route(
            "/transactions",
            get(inventory_handlers::list_inventory_transactions),
        )
        .route(
            "/transactions",
            post(inventory_handlers::create_transaction),
        )
        .route(
            "/transactions/{id}",
            get(inventory_handlers::get_transaction),
        )
        .route("/reservations", get(inventory_handlers::list_reservations))
        .route(
            "/reservations",
            post(inventory_handlers::create_reservation),
        )
        .route(
            "/reservations/{id}",
            get(inventory_handlers::get_reservation),
        )
        .route(
            "/reservations/{id}",
            put(inventory_handlers::update_reservation),
        )
        .route(
            "/reservations/{id}",
            delete(inventory_handlers::delete_reservation),
        )
        .route(
            "/reservations/{id}/status",
            put(inventory_handlers::update_reservation_status),
        )
        .route("/{id}", get(inventory_handlers::get_inventory_item))
        .route("/{id}", put(inventory_handlers::update_inventory_item))
        .route("/{id}", delete(inventory_handlers::delete_inventory_item))
        .route("/{id}/adjust", put(inventory_handlers::adjust_quantity));

    let order_routes = Router::new()
        .route("/", get(order_handlers::list_orders))
        .route("/", post(order_handlers::create_order))
        .route("/{id}", get(order_handlers::get_order))
        .route("/{id}", put(order_handlers::update_order))
        .route("/{id}/status", put(order_handlers::update_order_status))
        .route(
            "/{id}/items",
            get(|path, state| order_handlers::get_order_items(path, state)),
        )
        .route(
            "/{order_id}/items/{item_id}",
            put(
                |Path((order_id, item_id)): Path<(String, String)>, state, payload| async move {
                    let path = Path((order_id, item_id));
                    order_handlers::update_order_item(path, state, payload).await
                },
            ),
        )
        .route(
            "/{order_id}/items/{item_id}",
            delete(
                |Path((order_id, item_id)): Path<(String, String)>, state| async move {
                    let path = Path((order_id, item_id));
                    order_handlers::delete_order_item(path, state).await
                },
            ),
        );

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

    // Dashboard routes
    let dashboard_routes = Router::new()
        .route("/overview", get(dashboard_handlers::get_dashboard_overview))
        .route(
            "/inventory",
            get(dashboard_handlers::get_inventory_overview_handler),
        )
        .route(
            "/orders",
            get(dashboard_handlers::get_order_status_overview_handler),
        )
        .route(
            "/activities",
            get(dashboard_handlers::get_recent_activities_handler),
        );

    // Analytics routes
    let analytics_routes = Router::new()
        // Inventory Analytics
        .route(
            "/inventory/stock-levels",
            get(analytics_handlers::get_stock_level_trends),
        )
        .route(
            "/inventory/distribution",
            get(analytics_handlers::get_inventory_distribution),
        )
        .route(
            "/inventory/warehouse",
            get(analytics_handlers::get_warehouse_distribution),
        )
        .route(
            "/inventory/reorder",
            get(analytics_handlers::get_reorder_points),
        )
        // Order Analytics
        .route("/orders/flow", get(analytics_handlers::get_order_flow))
        .route(
            "/orders/pipeline",
            get(analytics_handlers::get_order_pipeline),
        )
        .route(
            "/orders/lifecycle",
            get(analytics_handlers::get_order_lifecycle),
        )
        .route(
            "/orders/volume-trends",
            get(analytics_handlers::get_order_volume_trends),
        )
        .route(
            "/orders/value-distribution",
            get(analytics_handlers::get_order_value_distribution),
        )
        .route(
            "/orders/peak-times",
            get(analytics_handlers::get_order_peak_times),
        )
        // Transaction Analytics
        .route(
            "/transactions/volume",
            get(analytics_handlers::get_transaction_volume),
        )
        .route(
            "/transactions/stock-movements",
            get(analytics_handlers::get_stock_movements),
        )
        .route(
            "/transactions/metrics",
            get(analytics_handlers::get_transaction_metrics),
        )
        .route(
            "/transactions/patterns",
            get(analytics_handlers::get_transaction_patterns),
        )
        .route(
            "/transactions/clusters",
            get(analytics_handlers::get_transaction_clusters),
        )
        .route(
            "/transactions/flow",
            get(analytics_handlers::get_transaction_flow),
        )
        // Performance Analytics
        .route(
            "/performance/metrics",
            get(analytics_handlers::get_real_time_metrics),
        )
        .route(
            "/performance/trends",
            get(analytics_handlers::get_performance_trends),
        )
        .route(
            "/performance/health",
            get(analytics_handlers::get_system_health),
        )
        .route(
            "/performance/resources",
            get(analytics_handlers::get_resource_utilization),
        )
        // Business Analytics
        .route(
            "/business/financial",
            get(analytics_handlers::get_financial_analytics),
        )
        .route(
            "/business/revenue",
            get(analytics_handlers::get_revenue_analysis),
        )
        .route(
            "/business/hierarchical",
            get(analytics_handlers::get_hierarchical_data),
        )
        .route(
            "/business/forecast",
            get(analytics_handlers::get_forecast_data),
        )
        .route(
            "/business/trends",
            get(analytics_handlers::get_trend_predictions),
        );

    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:3000".parse().unwrap(),
            "http://localhost:3001".parse().unwrap(),
            "http://localhost:3003".parse().unwrap(),
            "http://localhost:5173".parse().unwrap(),
        ])
        .allow_methods([
            http::Method::GET,
            http::Method::POST,
            http::Method::PUT,
            http::Method::DELETE,
            http::Method::OPTIONS,
            http::Method::HEAD,
            http::Method::PATCH,
        ])
        .allow_headers([
            http::header::AUTHORIZATION,
            http::header::ACCEPT,
            http::header::CONTENT_TYPE,
            http::header::CONTENT_LENGTH,
            http::header::ACCEPT_ENCODING,
            http::header::ACCEPT_LANGUAGE,
            http::header::ORIGIN,
            http::header::HOST,
            http::header::USER_AGENT,
            http::header::REFERER,
            http::header::CONNECTION,
            http::header::CACHE_CONTROL,
            HeaderName::from_static("x-requested-with"),
            HeaderName::from_static("x-user-id"),
        ])
        .expose_headers([
            http::header::AUTHORIZATION,
            http::header::CONTENT_TYPE,
            HeaderName::from_static("x-user-id"),
        ])
        .allow_credentials(true)
        .max_age(std::time::Duration::from_secs(3600));

    let api_routes = Router::new()
        .nest("/customers", customer_routes)
        .nest("/warehouses", warehouse_routes)
        .nest("/inventory", inventory_routes)
        .nest("/orders", order_routes)
        .nest("/shipping", shipping_routes)
        .nest("/payments", payment_routes)
        .nest("/dashboard", dashboard_routes)
        .nest("/analytics", analytics_routes)
        .layer(from_fn(auth_middleware));

    Router::new()
        .route("/health", get(|| async { "OK" }))
        .nest("/api", api_routes)
        .layer(cors)
        .with_state(state)
}
