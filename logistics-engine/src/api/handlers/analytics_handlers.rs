use crate::{
    api::SharedState,
    errors::Result,
    models::analytics::{
        FinancialAnalyticsResponse, InventoryDistributionResponse, OrderFlowResponse,
        OrderPipelineResponse, RealTimeMetricsResponse, ReorderPointsResponse,
        StockLevelTrendsResponse, TransactionVolumeResponse, WarehouseDistributionResponse,
    },
};
use axum::{extract::State, Json};
use tracing::{error, info};

// Inventory Analytics
pub async fn get_stock_level_trends(
    State(state): State<SharedState>,
) -> Result<Json<StockLevelTrendsResponse>> {
    info!("Handling request: get stock level trends");
    let data = state.analytics_service.get_stock_level_trends().await?;
    Ok(Json(data))
}

pub async fn get_inventory_distribution(
    State(state): State<SharedState>,
) -> Result<Json<InventoryDistributionResponse>> {
    info!("Handling request: get inventory distribution");
    let data = state.analytics_service.get_inventory_distribution().await?;
    Ok(Json(data))
}

pub async fn get_warehouse_distribution(
    State(state): State<SharedState>,
) -> Result<Json<WarehouseDistributionResponse>> {
    info!("Handling request: get warehouse distribution");
    let data = state.analytics_service.get_warehouse_distribution().await?;
    Ok(Json(data))
}

pub async fn get_reorder_points(
    State(state): State<SharedState>,
) -> Result<Json<ReorderPointsResponse>> {
    info!("Handling request: get reorder points");
    let data = state.analytics_service.get_reorder_points().await?;
    Ok(Json(data))
}

// Order Analytics
pub async fn get_order_flow(State(state): State<SharedState>) -> Result<Json<OrderFlowResponse>> {
    info!("Handling request: get order flow");
    let data = state.analytics_service.get_order_flow().await?;
    Ok(Json(data))
}

pub async fn get_order_pipeline(
    State(state): State<SharedState>,
) -> Result<Json<OrderPipelineResponse>> {
    info!("Handling request: get order pipeline");
    let data = state.analytics_service.get_order_pipeline().await?;
    Ok(Json(data))
}

pub async fn get_order_lifecycle(
    State(state): State<SharedState>,
) -> Result<Json<OrderPipelineResponse>> {
    info!("Handling request: get order lifecycle");
    let data = state.analytics_service.get_order_lifecycle().await?;
    Ok(Json(data))
}

pub async fn get_order_volume_trends(
    State(state): State<SharedState>,
) -> Result<Json<OrderFlowResponse>> {
    info!("Handling request: get order volume trends");
    let data = state.analytics_service.get_order_volume_trends().await?;
    Ok(Json(data))
}

pub async fn get_order_value_distribution(
    State(state): State<SharedState>,
) -> Result<Json<OrderFlowResponse>> {
    info!("Handling request: get order value distribution");
    let data = state
        .analytics_service
        .get_order_value_distribution()
        .await?;
    Ok(Json(data))
}

pub async fn get_order_peak_times(
    State(state): State<SharedState>,
) -> Result<Json<OrderFlowResponse>> {
    info!("Handling request: get order peak times");
    let data = state.analytics_service.get_order_peak_times().await?;
    Ok(Json(data))
}

// Transaction Analytics
pub async fn get_transaction_volume(
    State(state): State<SharedState>,
) -> Result<Json<TransactionVolumeResponse>> {
    info!("Handling request: get transaction volume");
    let data = state.analytics_service.get_transaction_volume().await?;
    Ok(Json(data))
}

pub async fn get_stock_movements(
    State(state): State<SharedState>,
) -> Result<Json<TransactionVolumeResponse>> {
    info!("Handling request: get stock movements");
    let data = state.analytics_service.get_stock_movements().await?;
    Ok(Json(data))
}

pub async fn get_transaction_metrics(
    State(state): State<SharedState>,
) -> Result<Json<TransactionVolumeResponse>> {
    info!("Handling request: get transaction metrics");
    let data = state.analytics_service.get_transaction_metrics().await?;
    Ok(Json(data))
}

pub async fn get_transaction_patterns(
    State(state): State<SharedState>,
) -> Result<Json<TransactionVolumeResponse>> {
    info!("Handling request: get transaction patterns");
    let data = state.analytics_service.get_transaction_patterns().await?;
    Ok(Json(data))
}

pub async fn get_transaction_clusters(
    State(state): State<SharedState>,
) -> Result<Json<TransactionVolumeResponse>> {
    info!("Handling request: get transaction clusters");
    let data = state.analytics_service.get_transaction_clusters().await?;
    Ok(Json(data))
}

pub async fn get_transaction_flow(
    State(state): State<SharedState>,
) -> Result<Json<TransactionVolumeResponse>> {
    info!("Handling request: get transaction flow");
    let data = state.analytics_service.get_transaction_flow().await?;
    Ok(Json(data))
}

// Performance Analytics
pub async fn get_real_time_metrics(
    State(state): State<SharedState>,
) -> Result<Json<RealTimeMetricsResponse>> {
    info!("Handling request: get real-time metrics");
    let data = state.analytics_service.get_real_time_metrics().await?;
    Ok(Json(data))
}

pub async fn get_performance_trends(
    State(state): State<SharedState>,
) -> Result<Json<RealTimeMetricsResponse>> {
    info!("Handling request: get performance trends");
    let data = state.analytics_service.get_performance_trends().await?;
    Ok(Json(data))
}

pub async fn get_system_health(
    State(state): State<SharedState>,
) -> Result<Json<RealTimeMetricsResponse>> {
    info!("Handling request: get system health");
    let data = state.analytics_service.get_system_health().await?;
    Ok(Json(data))
}

pub async fn get_resource_utilization(
    State(state): State<SharedState>,
) -> Result<Json<RealTimeMetricsResponse>> {
    info!("Handling request: get resource utilization");
    let data = state.analytics_service.get_resource_utilization().await?;
    Ok(Json(data))
}

// Business Analytics
pub async fn get_financial_analytics(
    State(state): State<SharedState>,
) -> Result<Json<FinancialAnalyticsResponse>> {
    info!("Handling request: get financial analytics");
    let data = state.analytics_service.get_financial_analytics().await?;
    Ok(Json(data))
}

pub async fn get_revenue_analysis(
    State(state): State<SharedState>,
) -> Result<Json<FinancialAnalyticsResponse>> {
    info!("Handling request: get revenue analysis");
    let data = state.analytics_service.get_revenue_analysis().await?;
    Ok(Json(data))
}

pub async fn get_hierarchical_data(
    State(state): State<SharedState>,
) -> Result<Json<FinancialAnalyticsResponse>> {
    info!("Handling request: get hierarchical data");
    let data = state.analytics_service.get_hierarchical_data().await?;
    Ok(Json(data))
}

pub async fn get_forecast_data(
    State(state): State<SharedState>,
) -> Result<Json<FinancialAnalyticsResponse>> {
    info!("Handling request: get forecast data");
    let data = state.analytics_service.get_forecast_data().await?;
    Ok(Json(data))
}

pub async fn get_trend_predictions(
    State(state): State<SharedState>,
) -> Result<Json<FinancialAnalyticsResponse>> {
    info!("Handling request: get trend predictions");
    let data = state.analytics_service.get_trend_predictions().await?;
    Ok(Json(data))
}
