use crate::errors::Result;
use crate::models::analytics::{
    BarChartMetadata, ChartMetadata, ComboChartMetadata, FinancialAnalyticsData,
    FinancialAnalyticsResponse, FunnelChartMetadata, GaugeChartMetadata, InventoryDistributionData,
    InventoryDistributionResponse, LineChartMetadata, OrderFlowData, OrderFlowResponse,
    OrderPipelineData, OrderPipelineResponse, PieChartMetadata, RealTimeMetricData,
    RealTimeMetricsResponse, ReorderPointData, ReorderPointsResponse, SankeyChartMetadata,
    StackedBarChartMetadata, StockLevelTrendData, StockLevelTrendsResponse, TransactionVolumeData,
    TransactionVolumeResponse, WarehouseDistributionData, WarehouseDistributionResponse,
};
use chrono::{DateTime, Utc};
use num_traits::ToPrimitive;
use rust_decimal;
use serde_json;
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
                SUM(quantity)::FLOAT8 as total_quantity
            FROM inventory_transactions
            GROUP BY date_trunc('day', created_at)
            ORDER BY date_trunc('day', created_at)
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| StockLevelTrendData {
                date: Self::convert_datetime(row.get("date")),
                quantity: row.get::<f64, _>("total_quantity"),
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
            .map(|row| {
                let hour = Self::convert_datetime(row.get("hour"));
                let transaction_count = row.get::<i64, _>("transaction_count");

                serde_json::json!({
                    "hour": hour,
                    "transaction_count": transaction_count
                })
            })
            .collect::<Vec<_>>();

        Ok(TransactionVolumeResponse {
            data: serde_json::json!(data),
            metadata: ChartMetadata::Line(LineChartMetadata {
                r#type: "line".to_string(),
                x_axis: "hour".to_string(),
                y_axis: "transactionCount".to_string(),
            }),
        })
    }

    pub async fn get_stock_movements(&self) -> Result<TransactionVolumeResponse> {
        let query = r#"
            SELECT 
                i.category as category,
                SUM(CASE WHEN t.type = 'INBOUND' THEN t.quantity ELSE 0 END)::TEXT as inbound,
                SUM(CASE WHEN t.type = 'OUTBOUND' THEN ABS(t.quantity) ELSE 0 END)::TEXT as outbound
            FROM inventory_transactions t
            JOIN inventory_items i ON t.item_id = i.id
            GROUP BY i.category
            ORDER BY i.category
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let category = row
                    .get::<Option<String>, _>("category")
                    .unwrap_or_else(|| "Uncategorized".to_string());

                let inbound: String = row.get("inbound");
                let outbound: String = row.get("outbound");

                let inbound_val = inbound.parse::<i64>().unwrap_or(0);
                let outbound_val = outbound.parse::<i64>().unwrap_or(0);

                serde_json::json!({
                    "category": category,
                    "inbound": inbound_val,
                    "outbound": outbound_val
                })
            })
            .collect::<Vec<_>>();

        Ok(TransactionVolumeResponse {
            data: serde_json::json!(data),
            metadata: ChartMetadata::StackedBar(StackedBarChartMetadata {
                r#type: "stacked-bar".to_string(),
                x_axis: "category".to_string(),
                y_axis: "value".to_string(),
                group_by: "direction".to_string(),
            }),
        })
    }

    pub async fn get_transaction_metrics(&self) -> Result<TransactionVolumeResponse> {
        let query = r#"
            SELECT 
                type::text as metric,
                COUNT(*) as value
            FROM inventory_transactions
            GROUP BY type
            ORDER BY value DESC
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let metric = row.get::<String, _>("metric");
                let value = row.get::<i64, _>("value");

                serde_json::json!({
                    "metric": metric,
                    "value": value
                })
            })
            .collect::<Vec<_>>();

        Ok(TransactionVolumeResponse {
            data: serde_json::json!(data),
            metadata: ChartMetadata::Pie(PieChartMetadata {
                r#type: "pie".to_string(),
                dimension: "metric".to_string(),
                metric: "value".to_string(),
            }),
        })
    }

    pub async fn get_transaction_patterns(&self) -> Result<TransactionVolumeResponse> {
        let query = r#"
            SELECT 
                EXTRACT(HOUR FROM created_at)::TEXT as hour,
                COUNT(*) as count
            FROM inventory_transactions
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY EXTRACT(HOUR FROM created_at)
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let hour_str: String = row.get("hour");
                let hour = hour_str.parse::<i32>().unwrap_or(0);
                let count = row.get::<i64, _>("count");

                serde_json::json!({
                    "hour": format!("{:02}:00", hour),
                    "count": count
                })
            })
            .collect::<Vec<_>>();

        Ok(TransactionVolumeResponse {
            data: serde_json::json!(data),
            metadata: ChartMetadata::Line(LineChartMetadata {
                r#type: "line".to_string(),
                x_axis: "hour".to_string(),
                y_axis: "count".to_string(),
            }),
        })
    }

    pub async fn get_transaction_clusters(&self) -> Result<TransactionVolumeResponse> {
        let query = r#"
            SELECT 
                w.name as warehouse,
                COUNT(*) as value
            FROM inventory_transactions t
            JOIN warehouses w ON t.warehouse_id = w.id
            GROUP BY w.name
            ORDER BY value DESC
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let warehouse = row.get::<String, _>("warehouse");
                let value = row.get::<i64, _>("value");

                serde_json::json!({
                    "group": warehouse,
                    "value": value
                })
            })
            .collect::<Vec<_>>();

        Ok(TransactionVolumeResponse {
            data: serde_json::json!(data),
            metadata: ChartMetadata::Pie(PieChartMetadata {
                r#type: "pie".to_string(),
                dimension: "group".to_string(),
                metric: "value".to_string(),
            }),
        })
    }

    pub async fn get_transaction_flow(&self) -> Result<TransactionVolumeResponse> {
        let query = r#"
            WITH transaction_flow AS (
                SELECT 
                    'Initiation' as source,
                    CASE 
                        WHEN reference LIKE 'ORD%' THEN 'Order'
                        WHEN reference LIKE 'ADJ%' THEN 'Adjustment'
                        WHEN reference LIKE 'RES%' THEN 'Reservation'
                        ELSE 'Other'
                    END as target,
                    COUNT(*) as value
                FROM inventory_transactions
                GROUP BY target
            )
            SELECT * FROM transaction_flow
            UNION ALL
            SELECT 
                target as source,
                'Completion' as target,
                value
            FROM transaction_flow
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let source = row.get::<String, _>("source");
                let target = row.get::<String, _>("target");
                let value = row.get::<i64, _>("value");

                serde_json::json!({
                    "source": source,
                    "target": target,
                    "value": value
                })
            })
            .collect::<Vec<_>>();

        Ok(TransactionVolumeResponse {
            data: serde_json::json!(data),
            metadata: ChartMetadata::Sankey(SankeyChartMetadata {
                r#type: "sankey".to_string(),
                nodes: "source".to_string(),
                value: "value".to_string(),
            }),
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

    pub async fn get_performance_trends(&self) -> Result<RealTimeMetricsResponse> {
        let query = r#"
            SELECT 
                date_trunc('day', created_at) as day,
                COUNT(*) as transaction_count,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::FLOAT8 as avg_processing_time
            FROM inventory_transactions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY date_trunc('day', created_at)
            ORDER BY date_trunc('day', created_at)
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let day = Self::convert_datetime(row.get("day"));
                let transaction_count = row.get::<i64, _>("transaction_count");
                let avg_processing_time = row
                    .get::<Option<f64>, _>("avg_processing_time")
                    .unwrap_or(0.0);

                RealTimeMetricData {
                    total_orders: transaction_count,
                    completed_orders: 0,
                    completion_rate: avg_processing_time,
                }
            })
            .collect::<Vec<_>>();

        Ok(RealTimeMetricsResponse {
            data,
            metadata: GaugeChartMetadata {
                r#type: "line".to_string(),
                metrics: vec!["totalOrders".to_string(), "completionRate".to_string()],
            },
        })
    }

    pub async fn get_system_health(&self) -> Result<RealTimeMetricsResponse> {
        let query = r#"
            SELECT 
                'current' as period,
                COUNT(*) as total_transactions,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::FLOAT8 as avg_response_time
            FROM inventory_transactions
            WHERE created_at >= NOW() - INTERVAL '1 hour'
            UNION ALL
            SELECT 
                'previous' as period,
                COUNT(*) as total_transactions,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::FLOAT8 as avg_response_time
            FROM inventory_transactions
            WHERE created_at >= NOW() - INTERVAL '2 hours' 
                AND created_at < NOW() - INTERVAL '1 hour'
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let total_transactions = row.get::<i64, _>("total_transactions");
                let avg_response_time = row
                    .get::<Option<f64>, _>("avg_response_time")
                    .unwrap_or(0.0);
                let system_load = if total_transactions > 0 {
                    (total_transactions as f64 * avg_response_time) / 60.0
                } else {
                    0.0
                };

                RealTimeMetricData {
                    total_orders: total_transactions,
                    completed_orders: 0,
                    completion_rate: system_load,
                }
            })
            .collect::<Vec<_>>();

        Ok(RealTimeMetricsResponse {
            data,
            metadata: GaugeChartMetadata {
                r#type: "gauge".to_string(),
                metrics: vec!["totalOrders".to_string(), "completionRate".to_string()],
            },
        })
    }

    pub async fn get_resource_utilization(&self) -> Result<RealTimeMetricsResponse> {
        let query = r#"
            WITH warehouse_utilization AS (
                SELECT 
                    w.id as warehouse_id,
                    w.name as warehouse_name,
                    COUNT(i.id) as item_count,
                    1000 as default_capacity -- Using a default capacity value since the column doesn't exist
                FROM warehouses w
                LEFT JOIN inventory_items i ON w.id = i.warehouse_id
                GROUP BY w.id, w.name
            )
            SELECT 
                warehouse_name,
                default_capacity as capacity,
                item_count,
                CASE 
                    WHEN default_capacity > 0 THEN (item_count::FLOAT8 / default_capacity) * 100
                    ELSE 0
                END as utilization_percentage
            FROM warehouse_utilization
            ORDER BY utilization_percentage DESC
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let capacity = row.get::<i32, _>("capacity");
                let item_count = row.get::<i64, _>("item_count");
                let utilization = row
                    .get::<Option<f64>, _>("utilization_percentage")
                    .unwrap_or(0.0);

                RealTimeMetricData {
                    total_orders: capacity as i64,
                    completed_orders: item_count,
                    completion_rate: utilization,
                }
            })
            .collect::<Vec<_>>();

        Ok(RealTimeMetricsResponse {
            data,
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

    pub async fn get_revenue_analysis(&self) -> Result<FinancialAnalyticsResponse> {
        let query = r#"
            SELECT 
                c.name as customer_name,
                SUM(o.total_amount) as revenue,
                COUNT(o.id) as order_count
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.status::text = 'COMPLETED'
                AND o.created_at >= NOW() - INTERVAL '12 months'
            GROUP BY c.name
            ORDER BY revenue DESC
            LIMIT 10
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let customer_name = row.get::<String, _>("customer_name");
                let revenue = row.get::<Option<f64>, _>("revenue").unwrap_or(0.0);
                let order_count = row.get::<i64, _>("order_count");
                let avg_order_value = if order_count > 0 {
                    revenue / order_count as f64
                } else {
                    0.0
                };

                FinancialAnalyticsData {
                    month: Utc::now(), // Using current time as placeholder
                    revenue,
                    order_count,
                    avg_order_value,
                }
            })
            .collect::<Vec<_>>();

        Ok(FinancialAnalyticsResponse {
            data,
            metadata: ComboChartMetadata {
                r#type: "bar".to_string(),
                x_axis: "month".to_string(),
                metrics: vec![
                    "revenue".to_string(),
                    "orderCount".to_string(),
                    "avgOrderValue".to_string(),
                ],
            },
        })
    }

    pub async fn get_hierarchical_data(&self) -> Result<FinancialAnalyticsResponse> {
        let query = r#"
            WITH RECURSIVE category_hierarchy AS (
                SELECT 
                    id, 
                    name, 
                    parent_id,
                    0 as level
                FROM categories
                WHERE parent_id IS NULL
                UNION ALL
                SELECT 
                    c.id, 
                    c.name, 
                    c.parent_id,
                    ch.level + 1
                FROM categories c
                JOIN category_hierarchy ch ON c.parent_id = ch.id
            ),
            category_revenues AS (
                SELECT 
                    i.category,
                    SUM(oi.quantity * oi.unit_price) as revenue
                FROM order_items oi
                JOIN inventory_items i ON oi.item_id = i.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status::text = 'COMPLETED'
                    AND o.created_at >= NOW() - INTERVAL '12 months'
                GROUP BY i.category
            )
            SELECT 
                ch.id,
                ch.name,
                ch.level,
                COALESCE(cr.revenue, 0) as revenue
            FROM category_hierarchy ch
            LEFT JOIN category_revenues cr ON ch.name = cr.category
            ORDER BY ch.level, ch.name
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let revenue = row.get::<Option<f64>, _>("revenue").unwrap_or(0.0);

                FinancialAnalyticsData {
                    month: Utc::now(), // Using current time as placeholder
                    revenue,
                    order_count: 0,
                    avg_order_value: 0.0,
                }
            })
            .collect::<Vec<_>>();

        Ok(FinancialAnalyticsResponse {
            data,
            metadata: ComboChartMetadata {
                r#type: "treemap".to_string(),
                x_axis: "name".to_string(),
                metrics: vec!["revenue".to_string()],
            },
        })
    }

    pub async fn get_forecast_data(&self) -> Result<FinancialAnalyticsResponse> {
        let query = r#"
            WITH monthly_data AS (
                SELECT 
                    date_trunc('month', created_at) as month,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE status::text = 'COMPLETED'
                    AND created_at >= NOW() - INTERVAL '24 months'
                GROUP BY date_trunc('month', created_at)
                ORDER BY date_trunc('month', created_at)
            ),
            growth_rates AS (
                SELECT 
                    month,
                    revenue,
                    LAG(revenue) OVER (ORDER BY month) as prev_revenue,
                    CASE 
                        WHEN LAG(revenue) OVER (ORDER BY month) > 0 
                        THEN (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month)
                        ELSE 0
                    END as growth_rate
                FROM monthly_data
            ),
            avg_growth AS (
                SELECT AVG(growth_rate) as avg_rate
                FROM growth_rates
                WHERE growth_rate IS NOT NULL
            )
            SELECT 
                md.month,
                md.revenue,
                md.revenue as actual_revenue,
                md.month + INTERVAL '1 month' as forecast_month,
                md.revenue * (1 + ag.avg_rate) as forecast_revenue
            FROM monthly_data md
            CROSS JOIN avg_growth ag
            ORDER BY md.month DESC
            LIMIT 12
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let month = Self::convert_datetime(row.get("month"));
                let revenue = row.get::<Option<f64>, _>("revenue").unwrap_or(0.0);
                let forecast_revenue = row.get::<Option<f64>, _>("forecast_revenue").unwrap_or(0.0);

                FinancialAnalyticsData {
                    month,
                    revenue: forecast_revenue,
                    order_count: 0,
                    avg_order_value: revenue, // Using actual revenue as avg_order_value for comparison
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
                    "avgOrderValue".to_string(), // Using this field for actual revenue
                ],
            },
        })
    }

    pub async fn get_trend_predictions(&self) -> Result<FinancialAnalyticsResponse> {
        let query = r#"
            WITH seasonal_data AS (
                SELECT 
                    EXTRACT(MONTH FROM created_at) as month_num,
                    TO_CHAR(created_at, 'Month') as month_name,
                    SUM(total_amount) as revenue,
                    COUNT(*) as order_count
                FROM orders
                WHERE status::text = 'COMPLETED'
                    AND created_at >= NOW() - INTERVAL '36 months'
                GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Month')
                ORDER BY month_num
            ),
            aggregated_data AS (
                SELECT 
                    month_num,
                    month_name,
                    AVG(revenue) as avg_revenue,
                    AVG(order_count) as avg_order_count
                FROM seasonal_data
                GROUP BY month_num, month_name
                ORDER BY month_num
            )
            SELECT 
                month_num,
                month_name,
                avg_revenue,
                avg_order_count,
                CASE 
                    WHEN LAG(avg_revenue) OVER (ORDER BY month_num) IS NOT NULL 
                    THEN (avg_revenue - LAG(avg_revenue) OVER (ORDER BY month_num)) / LAG(avg_revenue) OVER (ORDER BY month_num) * 100
                    ELSE 0
                END as growth_percentage
            FROM aggregated_data
            ORDER BY month_num
        "#;

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let data = rows
            .iter()
            .map(|row| {
                let month_name: String = row.get("month_name");
                let revenue = row.get::<Option<f64>, _>("avg_revenue").unwrap_or(0.0);
                let order_count = row.get::<Option<f64>, _>("avg_order_count").unwrap_or(0.0);
                let growth = row
                    .get::<Option<f64>, _>("growth_percentage")
                    .unwrap_or(0.0);

                FinancialAnalyticsData {
                    month: Utc::now(), // Using current time as placeholder
                    revenue,
                    order_count: order_count as i64,
                    avg_order_value: growth,
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
                    "avgOrderValue".to_string(), // Using this field for growth percentage
                ],
            },
        })
    }
}
