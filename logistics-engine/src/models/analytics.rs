use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

// Common metadata structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineChartMetadata {
    pub r#type: String,
    pub x_axis: String,
    pub y_axis: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PieChartMetadata {
    pub r#type: String,
    pub dimension: String,
    pub metric: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BarChartMetadata {
    pub r#type: String,
    pub x_axis: String,
    pub y_axis: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackedBarChartMetadata {
    pub r#type: String,
    pub x_axis: String,
    pub y_axis: String,
    pub group_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SankeyChartMetadata {
    pub r#type: String,
    pub nodes: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunnelChartMetadata {
    pub r#type: String,
    pub dimension: String,
    pub metrics: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GaugeChartMetadata {
    pub r#type: String,
    pub metrics: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComboChartMetadata {
    pub r#type: String,
    pub x_axis: String,
    pub metrics: Vec<String>,
}

// Stock Level Trends
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockLevelTrendData {
    pub date: DateTime<Utc>,
    pub quantity: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockLevelTrendsResponse {
    pub data: Vec<StockLevelTrendData>,
    pub metadata: LineChartMetadata,
}

// Inventory Distribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryDistributionData {
    pub category: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryDistributionResponse {
    pub data: Vec<InventoryDistributionData>,
    pub metadata: PieChartMetadata,
}

// Warehouse Distribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WarehouseDistributionData {
    pub warehouse: String,
    pub category: String,
    pub item_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WarehouseDistributionResponse {
    pub data: Vec<WarehouseDistributionData>,
    pub metadata: StackedBarChartMetadata,
}

// Reorder Points
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReorderPointData {
    pub id: Uuid,
    pub name: String,
    pub quantity: i32,
    pub low_stock_threshold: Option<i32>,
    pub overstock_threshold: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReorderPointsResponse {
    pub data: Vec<ReorderPointData>,
    pub metadata: BarChartMetadata,
}

// Order Flow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderFlowData {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderFlowResponse {
    pub data: Vec<OrderFlowData>,
    pub metadata: SankeyChartMetadata,
}

// Order Pipeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderPipelineData {
    pub status: String,
    pub count: i64,
    pub avg_processing_time: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderPipelineResponse {
    pub data: Vec<OrderPipelineData>,
    pub metadata: FunnelChartMetadata,
}

// Transaction Volume
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionVolumeData {
    pub hour: DateTime<Utc>,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionVolumeResponse {
    pub data: Vec<TransactionVolumeData>,
    pub metadata: LineChartMetadata,
}

// Real-time Metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealTimeMetricData {
    pub total_orders: i64,
    pub completed_orders: i64,
    pub completion_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealTimeMetricsResponse {
    pub data: Vec<RealTimeMetricData>,
    pub metadata: GaugeChartMetadata,
}

// Financial Analytics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinancialAnalyticsData {
    pub month: DateTime<Utc>,
    pub revenue: f64,
    pub order_count: i64,
    pub avg_order_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinancialAnalyticsResponse {
    pub data: Vec<FinancialAnalyticsData>,
    pub metadata: ComboChartMetadata,
}

// Generic Analytics Response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AnalyticsResponse {
    StockLevelTrends(StockLevelTrendsResponse),
    InventoryDistribution(InventoryDistributionResponse),
    WarehouseDistribution(WarehouseDistributionResponse),
    ReorderPoints(ReorderPointsResponse),
    OrderFlow(OrderFlowResponse),
    OrderPipeline(OrderPipelineResponse),
    TransactionVolume(TransactionVolumeResponse),
    RealTimeMetrics(RealTimeMetricsResponse),
    FinancialAnalytics(FinancialAnalyticsResponse),
}
