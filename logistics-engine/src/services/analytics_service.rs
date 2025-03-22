use crate::{
    db::repository::analytics_repository::AnalyticsRepository,
    errors::{LogisticsError, Result},
    models::analytics::{
        FinancialAnalyticsResponse, InventoryDistributionResponse, OrderFlowResponse,
        OrderPipelineResponse, RealTimeMetricsResponse, ReorderPointsResponse,
        StockLevelTrendsResponse, TransactionVolumeResponse, WarehouseDistributionResponse,
    },
};
use std::sync::Arc;

#[derive(Clone)]
pub struct AnalyticsService {
    repository: Arc<AnalyticsRepository>,
}

impl AnalyticsService {
    pub fn new(repository: Arc<AnalyticsRepository>) -> Self {
        Self { repository }
    }

    // Inventory Analytics
    pub async fn get_stock_level_trends(&self) -> Result<StockLevelTrendsResponse> {
        let data = self.repository.get_stock_level_trends().await?;
        Ok(data)
    }

    pub async fn get_inventory_distribution(&self) -> Result<InventoryDistributionResponse> {
        let data = self.repository.get_inventory_distribution().await?;
        Ok(data)
    }

    pub async fn get_warehouse_distribution(&self) -> Result<WarehouseDistributionResponse> {
        let data = self.repository.get_warehouse_distribution().await?;
        Ok(data)
    }

    pub async fn get_reorder_points(&self) -> Result<ReorderPointsResponse> {
        let data = self.repository.get_reorder_points().await?;
        Ok(data)
    }

    // Order Analytics
    pub async fn get_order_flow(&self) -> Result<OrderFlowResponse> {
        let data = self.repository.get_order_flow().await?;
        Ok(data)
    }

    pub async fn get_order_pipeline(&self) -> Result<OrderPipelineResponse> {
        let data = self.repository.get_order_pipeline().await?;
        Ok(data)
    }

    pub async fn get_order_lifecycle(&self) -> Result<OrderPipelineResponse> {
        let data = self.repository.get_order_pipeline().await?;
        Ok(data)
    }

    pub async fn get_order_volume_trends(&self) -> Result<OrderFlowResponse> {
        let data = self.repository.get_order_flow().await?;
        Ok(data)
    }

    pub async fn get_order_value_distribution(&self) -> Result<OrderFlowResponse> {
        let data = self.repository.get_order_flow().await?;
        Ok(data)
    }

    pub async fn get_order_peak_times(&self) -> Result<OrderFlowResponse> {
        let data = self.repository.get_order_flow().await?;
        Ok(data)
    }

    // Transaction Analytics
    pub async fn get_transaction_volume(&self) -> Result<TransactionVolumeResponse> {
        let data = self.repository.get_transaction_volume().await?;
        Ok(data)
    }

    pub async fn get_stock_movements(&self) -> Result<TransactionVolumeResponse> {
        let data = self.repository.get_stock_movements().await?;
        Ok(data)
    }

    pub async fn get_transaction_metrics(&self) -> Result<TransactionVolumeResponse> {
        let data = self.repository.get_transaction_metrics().await?;
        Ok(data)
    }

    pub async fn get_transaction_patterns(&self) -> Result<TransactionVolumeResponse> {
        let data = self.repository.get_transaction_patterns().await?;
        Ok(data)
    }

    pub async fn get_transaction_clusters(&self) -> Result<TransactionVolumeResponse> {
        let data = self.repository.get_transaction_clusters().await?;
        Ok(data)
    }

    pub async fn get_transaction_flow(&self) -> Result<TransactionVolumeResponse> {
        let data = self.repository.get_transaction_flow().await?;
        Ok(data)
    }

    // Performance Analytics
    pub async fn get_real_time_metrics(&self) -> Result<RealTimeMetricsResponse> {
        let data = self.repository.get_real_time_metrics().await?;
        Ok(data)
    }

    pub async fn get_performance_trends(&self) -> Result<RealTimeMetricsResponse> {
        let data = self.repository.get_performance_trends().await?;
        Ok(data)
    }

    pub async fn get_system_health(&self) -> Result<RealTimeMetricsResponse> {
        let data = self.repository.get_system_health().await?;
        Ok(data)
    }

    pub async fn get_resource_utilization(&self) -> Result<RealTimeMetricsResponse> {
        let data = self.repository.get_resource_utilization().await?;
        Ok(data)
    }

    // Business Analytics
    pub async fn get_financial_analytics(&self) -> Result<FinancialAnalyticsResponse> {
        let data = self.repository.get_financial_analytics().await?;
        Ok(data)
    }

    pub async fn get_revenue_analysis(&self) -> Result<FinancialAnalyticsResponse> {
        let data = self.repository.get_revenue_analysis().await?;
        Ok(data)
    }

    pub async fn get_hierarchical_data(&self) -> Result<FinancialAnalyticsResponse> {
        let data = self.repository.get_hierarchical_data().await?;
        Ok(data)
    }

    pub async fn get_forecast_data(&self) -> Result<FinancialAnalyticsResponse> {
        let data = self.repository.get_forecast_data().await?;
        Ok(data)
    }

    pub async fn get_trend_predictions(&self) -> Result<FinancialAnalyticsResponse> {
        let data = self.repository.get_trend_predictions().await?;
        Ok(data)
    }
}
