export interface IChartMetadata {
  type: string;
  xAxis?: string;
  yAxis?: string | string[];
  dimension?: string;
  metric?: string;
  metrics?: string[];
  nodes?: string;
  value?: string;
  groupBy?: string;
}

export interface IChartData {
  data: any[];
  metadata: IChartMetadata;
}

export interface IAnalyticsConfig {
  baseUrl: string;
  endpoints: {
    inventory: {
      stockTrends: string;
      distribution: string;
      warehouseDistribution: string;
      reorderPoints: string;
    };
    orders: {
      flow: string;
      pipeline: string;
      lifecycle: string;
      volumeTrends: string;
      valueDistribution: string;
      peakTimes: string;
    };
    transactions: {
      volume: string;
      stockMovements: string;
      metrics: string;
      patterns: string;
      clusters: string;
      flow: string;
    };
    performance: {
      metrics: string;
      trends: string;
      health: string;
      resources: string;
    };
    business: {
      financial: string;
      revenue: string;
      hierarchical: string;
      forecast: string;
      trends: string;
    };
  };
}
