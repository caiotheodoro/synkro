import { ApiService } from "./api.service";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface ChartData {
  data: any[];
  metadata: {
    type: string;
    xAxis?: string;
    yAxis?: string | string[];
    dimension?: string;
    metric?: string;
    metrics?: string[];
    nodes?: string;
    value?: string;
    groupBy?: string;
  };
}

export const analyticsService = {
  // Inventory Analytics
  getStockLevelTrends: () =>
    apiService.get<ChartData>("/api/analytics/inventory/stock-trends"),

  getInventoryDistribution: () =>
    apiService.get<ChartData>("/api/analytics/inventory/distribution"),

  getWarehouseDistribution: () =>
    apiService
      .get<ChartData>("/api/analytics/inventory/warehouse-distribution")
      .then((response) => {
        // Fix field names if they're in snake_case
        if (response && response.metadata) {
          // Use type assertion to access potential snake_case properties
          const meta = response.metadata as any;

          // Map snake_case to camelCase for consistency
          if (meta.x_axis && !meta.xAxis) {
            response.metadata.xAxis = meta.x_axis;
          }
          if (meta.y_axis && !meta.yAxis) {
            response.metadata.yAxis = meta.y_axis;
          }
          if (meta.group_by && !meta.groupBy) {
            response.metadata.groupBy = meta.group_by;
          }
        }
        return response;
      }),

  getReorderPoints: () =>
    apiService.get<ChartData>("/api/analytics/inventory/reorder-points"),

  // Order Analytics
  getOrderFlow: () => apiService.get<ChartData>("/api/analytics/orders/flow"),

  getOrderPipeline: () =>
    apiService.get<ChartData>("/api/analytics/orders/pipeline"),

  getOrderLifecycle: () =>
    apiService.get<ChartData>("/api/analytics/orders/lifecycle"),

  getOrderVolumeTrends: () =>
    apiService.get<ChartData>("/api/analytics/orders/volume-trends"),

  getOrderValueDistribution: () =>
    apiService.get<ChartData>("/api/analytics/orders/value-distribution"),

  getOrderPeakTimes: () =>
    apiService.get<ChartData>("/api/analytics/orders/peak-times"),

  // Transaction Analytics
  getTransactionVolume: () =>
    apiService.get<ChartData>("/api/analytics/transactions/volume"),

  getStockMovements: () =>
    apiService.get<ChartData>("/api/analytics/transactions/stock-movements"),

  getTransactionMetrics: () =>
    apiService.get<ChartData>("/api/analytics/transactions/metrics"),

  getTransactionPatterns: () =>
    apiService.get<ChartData>("/api/analytics/transactions/patterns"),

  getTransactionClusters: () =>
    apiService.get<ChartData>("/api/analytics/transactions/clusters"),

  getTransactionFlow: () =>
    apiService.get<ChartData>("/api/analytics/transactions/flow"),

  // Performance Analytics
  getRealTimeMetrics: () =>
    apiService.get<ChartData>("/api/analytics/performance/metrics"),

  getPerformanceTrends: () =>
    apiService.get<ChartData>("/api/analytics/performance/trends"),

  getSystemHealth: () =>
    apiService.get<ChartData>("/api/analytics/performance/health"),

  getResourceUtilization: () =>
    apiService.get<ChartData>("/api/analytics/performance/resources"),

  // Business Analytics
  getFinancialAnalytics: () =>
    apiService.get<ChartData>("/api/analytics/business/financial"),

  getRevenueAnalysis: () =>
    apiService.get<ChartData>("/api/analytics/business/revenue"),

  getHierarchicalData: () =>
    apiService.get<ChartData>("/api/analytics/business/hierarchical"),

  getForecastData: () =>
    apiService.get<ChartData>("/api/analytics/business/forecast"),

  getTrendPredictions: () =>
    apiService.get<ChartData>("/api/analytics/business/trends"),
};
