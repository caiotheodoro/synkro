import { AnalyticsService } from "../services/analytics.service";
import { IChartData } from "../models/interfaces/analytics.interface";

export class AnalyticsController {
  private static instance: AnalyticsController;
  private readonly service: AnalyticsService;

  private constructor() {
    this.service = new AnalyticsService();
  }

  public static getInstance(): AnalyticsController {
    if (!AnalyticsController.instance) {
      AnalyticsController.instance = new AnalyticsController();
    }
    return AnalyticsController.instance;
  }

  // Inventory Analytics
  public async getInventoryAnalytics(): Promise<{
    stockTrends: IChartData;
    distribution: IChartData;
    warehouseDistribution: IChartData;
    reorderPoints: IChartData;
  }> {
    const [stockTrends, distribution, warehouseDistribution, reorderPoints] =
      await Promise.all([
        this.service.getStockLevelTrends(),
        this.service.getInventoryDistribution(),
        this.service.getWarehouseDistribution(),
        this.service.getReorderPoints(),
      ]);

    return {
      stockTrends,
      distribution,
      warehouseDistribution,
      reorderPoints,
    };
  }

  // Order Analytics
  public async getOrderAnalytics(): Promise<{
    flow: IChartData;
    pipeline: IChartData;
    lifecycle: IChartData;
    volumeTrends: IChartData;
    valueDistribution: IChartData;
    peakTimes: IChartData;
  }> {
    const [
      flow,
      pipeline,
      lifecycle,
      volumeTrends,
      valueDistribution,
      peakTimes,
    ] = await Promise.all([
      this.service.getOrderFlow(),
      this.service.getOrderPipeline(),
      this.service.getOrderLifecycle(),
      this.service.getOrderVolumeTrends(),
      this.service.getOrderValueDistribution(),
      this.service.getOrderPeakTimes(),
    ]);

    return {
      flow,
      pipeline,
      lifecycle,
      volumeTrends,
      valueDistribution,
      peakTimes,
    };
  }

  // Transaction Analytics
  public async getTransactionAnalytics(): Promise<{
    volume: IChartData;
    stockMovements: IChartData;
    metrics: IChartData;
    patterns: IChartData;
    clusters: IChartData;
    flow: IChartData;
  }> {
    const [volume, stockMovements, metrics, patterns, clusters, flow] =
      await Promise.all([
        this.service.getTransactionVolume(),
        this.service.getStockMovements(),
        this.service.getTransactionMetrics(),
        this.service.getTransactionPatterns(),
        this.service.getTransactionClusters(),
        this.service.getTransactionFlow(),
      ]);

    return {
      volume,
      stockMovements,
      metrics,
      patterns,
      clusters,
      flow,
    };
  }

  // Performance Analytics
  public async getPerformanceAnalytics(): Promise<{
    realTimeMetrics: IChartData;
    trends: IChartData;
    health: IChartData;
    resources: IChartData;
  }> {
    const [realTimeMetrics, trends, health, resources] = await Promise.all([
      this.service.getRealTimeMetrics(),
      this.service.getPerformanceTrends(),
      this.service.getSystemHealth(),
      this.service.getResourceUtilization(),
    ]);

    return {
      realTimeMetrics,
      trends,
      health,
      resources,
    };
  }

  // Business Analytics
  public async getBusinessAnalytics(): Promise<{
    financial: IChartData;
    revenue: IChartData;
    hierarchical: IChartData;
    forecast: IChartData;
    trends: IChartData;
  }> {
    const [financial, revenue, hierarchical, forecast, trends] =
      await Promise.all([
        this.service.getFinancialAnalytics(),
        this.service.getRevenueAnalysis(),
        this.service.getHierarchicalData(),
        this.service.getForecastData(),
        this.service.getTrendPredictions(),
      ]);

    return {
      financial,
      revenue,
      hierarchical,
      forecast,
      trends,
    };
  }
}
