import { BaseService } from "./base.service";
import {
  IChartData,
  IAnalyticsConfig,
} from "../models/interfaces/analytics.interface";
import { ANALYTICS_CONFIG } from "../utils/constants";
import { formatChartData } from "../utils/helpers";

export class AnalyticsService extends BaseService {
  private readonly config: IAnalyticsConfig;

  constructor() {
    super({ baseUrl: ANALYTICS_CONFIG.baseUrl });
    this.config = ANALYTICS_CONFIG;
  }

  // Inventory Analytics
  public async getStockLevelTrends(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.inventory.stockTrends
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getInventoryDistribution(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.inventory.distribution
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getWarehouseDistribution(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.inventory.warehouseDistribution
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getReorderPoints(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.inventory.reorderPoints
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  // Order Analytics
  public async getOrderFlow(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.orders.flow
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getOrderPipeline(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.orders.pipeline
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getOrderLifecycle(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.orders.lifecycle
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getOrderVolumeTrends(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.orders.volumeTrends
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getOrderValueDistribution(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.orders.valueDistribution
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getOrderPeakTimes(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.orders.peakTimes
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  // Transaction Analytics
  public async getTransactionVolume(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.transactions.volume
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getStockMovements(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.transactions.stockMovements
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getTransactionMetrics(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.transactions.metrics
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getTransactionPatterns(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.transactions.patterns
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getTransactionClusters(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.transactions.clusters
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getTransactionFlow(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.transactions.flow
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  // Performance Analytics
  public async getRealTimeMetrics(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.performance.metrics
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getPerformanceTrends(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.performance.trends
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getSystemHealth(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.performance.health
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getResourceUtilization(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.performance.resources
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  // Business Analytics
  public async getFinancialAnalytics(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.business.financial
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getRevenueAnalysis(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.business.revenue
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getHierarchicalData(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.business.hierarchical
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getForecastData(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.business.forecast
    );
    return formatChartData(response.data.data, response.data.metadata);
  }

  public async getTrendPredictions(): Promise<IChartData> {
    const response = await this.get<IChartData>(
      this.config.endpoints.business.trends
    );
    return formatChartData(response.data.data, response.data.metadata);
  }
}
