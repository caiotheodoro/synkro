use crate::errors::Result;
use crate::models::analytics::{
    BarChartMetadata, ComboChartMetadata, FinancialAnalyticsData, FinancialAnalyticsResponse,
    FunnelChartMetadata, GaugeChartMetadata, InventoryDistributionData,
    InventoryDistributionResponse, LineChartMetadata, OrderFlowData, OrderFlowResponse,
    OrderPipelineData, OrderPipelineResponse, PieChartMetadata, RealTimeMetricData,
    RealTimeMetricsResponse, ReorderPointData, ReorderPointsResponse, SankeyChartMetadata,
    StackedBarChartMetadata, StockLevelTrendData, StockLevelTrendsResponse, TransactionVolumeData,
    TransactionVolumeResponse, WarehouseDistributionData, WarehouseDistributionResponse,
};
use chrono::{DateTime, Utc};
use sqlx::{types::time::OffsetDateTime, Error, PgPool, Row};

#[derive(Clone)]
pub struct AnalyticsRepository {
    pool: PgPool,
}

impl AnalyticsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn convert_datetime(offset_dt: OffsetDateTime) -> DateTime<Utc> {
        DateTime::<Utc>::from_timestamp(offset_dt.unix_timestamp(), offset_dt.nanosecond() as u32)
            .unwrap_or_else(|| Utc::now())
    }

    // Inventory Analytics
    pub async fn get_stock_level_trends(&self) -> Result<StockLevelTrendsResponse> {
        let query = r#"
            SELECT 
                date_trunc('day', created_at) as date,
                SUM(quantity) as total_quantity
            FROM inventory_transactions
            GROUP BY date_trunc('day', created_at)
            ORDER BY date_trunc('day', created_at)
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| StockLevelTrendData {
                date: Self::convert_datetime(row.get("date")),
                quantity: row.get::<i64, _>("total_quantity"),
            })
            .collect::<Vec<_>>();

        Ok(StockLevelTrendsResponse {
            data,
            metadata: LineChartMetadata {
                r#type: "line".to_string(),
                x_axis: "date".to_string(),
                y_axis: "quantity".to_string(),
            },
        })
    }

    pub async fn get_inventory_distribution(&self) -> Result<InventoryDistributionResponse> {
        let query = r#"
            SELECT 
                category,
                COUNT(*) as count
            FROM inventory_items
            GROUP BY category
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| InventoryDistributionData {
                category: row
                    .get::<Option<String>, _>("category")
                    .unwrap_or_else(|| "Uncategorized".to_string()),
                count: row.get::<i64, _>("count"),
            })
            .collect::<Vec<_>>();

        Ok(InventoryDistributionResponse {
            data,
            metadata: PieChartMetadata {
                r#type: "pie".to_string(),
                dimension: "category".to_string(),
                metric: "count".to_string(),
            },
        })
    }

    pub async fn get_warehouse_distribution(&self) -> Result<WarehouseDistributionResponse> {
        let query = r#"
            SELECT 
                w.name as warehouse,
                i.category,
                COUNT(*) as item_count
            FROM inventory_items i
            JOIN warehouses w ON i.warehouse_id = w.id
            GROUP BY w.name, i.category
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| WarehouseDistributionData {
                warehouse: row.get::<String, _>("warehouse"),
                category: row
                    .get::<Option<String>, _>("category")
                    .unwrap_or_else(|| "Uncategorized".to_string()),
                item_count: row.get::<i64, _>("item_count"),
            })
            .collect::<Vec<_>>();

        Ok(WarehouseDistributionResponse {
            data,
            metadata: StackedBarChartMetadata {
                r#type: "stacked-bar".to_string(),
                x_axis: "warehouse".to_string(),
                y_axis: "item_count".to_string(),
                group_by: "category".to_string(),
            },
        })
    }

    pub async fn get_reorder_points(&self) -> Result<ReorderPointsResponse> {
        let query = r#"
            SELECT 
                id,
                name,
                quantity,
                low_stock_threshold,
                overstock_threshold
            FROM inventory_items
            WHERE low_stock_threshold IS NOT NULL
            AND quantity <= low_stock_threshold
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| ReorderPointData {
                id: row.get::<sqlx::types::Uuid, _>("id"),
                name: row.get::<String, _>("name"),
                quantity: row.get::<i32, _>("quantity"),
                low_stock_threshold: row.get::<Option<i32>, _>("low_stock_threshold"),
                overstock_threshold: row.get::<Option<i32>, _>("overstock_threshold"),
            })
            .collect::<Vec<_>>();

        Ok(ReorderPointsResponse {
            data,
            metadata: BarChartMetadata {
                r#type: "bar".to_string(),
                x_axis: "name".to_string(),
                y_axis: vec![
                    "quantity".to_string(),
                    "lowStockThreshold".to_string(),
                    "overstockThreshold".to_string(),
                ],
            },
        })
    }

    // Order Analytics
    pub async fn get_order_flow(&self) -> Result<OrderFlowResponse> {
        let query = r#"
            SELECT 
                status::text as status,
                COUNT(*) as count
            FROM orders
            GROUP BY status
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| OrderFlowData {
                status: row.get::<String, _>("status"),
                count: row.get::<i64, _>("count"),
            })
            .collect::<Vec<_>>();

        Ok(OrderFlowResponse {
            data,
            metadata: SankeyChartMetadata {
                r#type: "sankey".to_string(),
                nodes: "status".to_string(),
                value: "count".to_string(),
            },
        })
    }

    pub async fn get_order_pipeline(&self) -> Result<OrderPipelineResponse> {
        let query = r#"
            SELECT 
                status::text as status,
                COUNT(*) as count,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::FLOAT8 as avg_time
            FROM orders
            GROUP BY status
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| OrderPipelineData {
                status: row.get::<String, _>("status"),
                count: row.get::<i64, _>("count"),
                avg_processing_time: row.get::<Option<f64>, _>("avg_time").unwrap_or(0.0),
            })
            .collect::<Vec<_>>();

        Ok(OrderPipelineResponse {
            data,
            metadata: FunnelChartMetadata {
                r#type: "funnel".to_string(),
                dimension: "status".to_string(),
                metrics: vec!["count".to_string(), "avgProcessingTime".to_string()],
            },
        })
    }

    // Transaction Analytics
    pub async fn get_transaction_volume(&self) -> Result<TransactionVolumeResponse> {
        let query = r#"
            SELECT 
                date_trunc('hour', created_at) as hour,
                COUNT(*) as transaction_count
            FROM inventory_transactions
            GROUP BY date_trunc('hour', created_at)
            ORDER BY date_trunc('hour', created_at)
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| TransactionVolumeData {
                hour: Self::convert_datetime(row.get("hour")),
                transaction_count: row.get::<i64, _>("transaction_count"),
            })
            .collect::<Vec<_>>();

        Ok(TransactionVolumeResponse {
            data,
            metadata: LineChartMetadata {
                r#type: "line".to_string(),
                x_axis: "hour".to_string(),
                y_axis: "transactionCount".to_string(),
            },
        })
    }

    // Performance Analytics
    pub async fn get_real_time_metrics(&self) -> Result<RealTimeMetricsResponse> {
        let query = r#"
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status::text = 'COMPLETED' THEN 1 END) as completed_orders
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '1 hour'
        "#;

        let row = sqlx::query(query).fetch_one(&self.pool).await?;

        let total_orders = row.get::<i64, _>("total_orders");
        let completed_orders = row.get::<i64, _>("completed_orders");
        let completion_rate = if total_orders > 0 {
            (completed_orders as f64 / total_orders as f64) * 100.0
        } else {
            0.0
        };

        let metric_data = RealTimeMetricData {
            total_orders,
            completed_orders,
            completion_rate,
        };

        Ok(RealTimeMetricsResponse {
            data: vec![metric_data],
            metadata: GaugeChartMetadata {
                r#type: "gauge".to_string(),
                metrics: vec![
                    "totalOrders".to_string(),
                    "completedOrders".to_string(),
                    "completionRate".to_string(),
                ],
            },
        })
    }

    // Business Analytics
    pub async fn get_financial_analytics(&self) -> Result<FinancialAnalyticsResponse> {
        let query = r#"
            SELECT 
                date_trunc('month', created_at) as month,
                SUM(total_amount) as revenue,
                COUNT(*) as order_count
            FROM orders
            WHERE status::text = 'COMPLETED'
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let revenue = row.get::<Option<f64>, _>("revenue").unwrap_or(0.0);
                let order_count = row.get::<i64, _>("order_count");
                let avg_order_value = if order_count > 0 {
                    revenue / order_count as f64
                } else {
                    0.0
                };

                FinancialAnalyticsData {
                    month: Self::convert_datetime(row.get("month")),
                    revenue,
                    order_count,
                    avg_order_value,
                }
            })
            .collect::<Vec<_>>();

        Ok(FinancialAnalyticsResponse {
            data,
            metadata: ComboChartMetadata {
                r#type: "combo".to_string(),
                x_axis: "month".to_string(),
                metrics: vec![
                    "revenue".to_string(),
                    "orderCount".to_string(),
                    "avgOrderValue".to_string(),
                ],
            },
        })
    }
}
