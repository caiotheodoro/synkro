export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  timeout: 30000,
};

export const AUTH_CONFIG = {
  tokenKey: process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "synkro_token",
  userKey: process.env.NEXT_PUBLIC_AUTH_USER_KEY ?? "synkro_user",
  authServiceUrl:
    process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "http://localhost:3000",
  authInterfaceUrl:
    process.env.NEXT_PUBLIC_AUTH_INTERFACE_URL ?? "http://localhost:5173",
};

export const ANALYTICS_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  endpoints: {
    inventory: {
      stockTrends: "/api/analytics/inventory/stock-trends",
      distribution: "/api/analytics/inventory/distribution",
      warehouseDistribution: "/api/analytics/inventory/warehouse-distribution",
      reorderPoints: "/api/analytics/inventory/reorder-points",
    },
    orders: {
      flow: "/api/analytics/orders/flow",
      pipeline: "/api/analytics/orders/pipeline",
      lifecycle: "/api/analytics/orders/lifecycle",
      volumeTrends: "/api/analytics/orders/volume-trends",
      valueDistribution: "/api/analytics/orders/value-distribution",
      peakTimes: "/api/analytics/orders/peak-times",
    },
    transactions: {
      volume: "/api/analytics/transactions/volume",
      stockMovements: "/api/analytics/transactions/stock-movements",
      metrics: "/api/analytics/transactions/metrics",
      patterns: "/api/analytics/transactions/patterns",
      clusters: "/api/analytics/transactions/clusters",
      flow: "/api/analytics/transactions/flow",
    },
    performance: {
      metrics: "/api/analytics/performance/metrics",
      trends: "/api/analytics/performance/trends",
      health: "/api/analytics/performance/health",
      resources: "/api/analytics/performance/resources",
    },
    business: {
      financial: "/api/analytics/business/financial",
      revenue: "/api/analytics/business/revenue",
      hierarchical: "/api/analytics/business/hierarchical",
      forecast: "/api/analytics/business/forecast",
      trends: "/api/analytics/business/trends",
    },
  },
};
