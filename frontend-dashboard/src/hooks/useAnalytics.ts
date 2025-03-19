import { useState, useCallback } from "react";
import { ApiService } from "@/services/api.service";

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

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Inventory Analytics
  const getStockLevelTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/inventory/stock-trends"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInventoryDistribution = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/inventory/distribution"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWarehouseDistribution = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/inventory/warehouse-distribution"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getReorderPoints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/inventory/reorder-points"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Order Analytics
  const getOrderFlow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>("/api/analytics/orders/flow");
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>("/api/analytics/orders/pipeline");
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderLifecycle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>("/api/analytics/orders/lifecycle");
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderVolumeTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/orders/volume-trends"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderValueDistribution = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/orders/value-distribution"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderPeakTimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/orders/peak-times"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Transaction Analytics
  const getTransactionVolume = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/transactions/volume"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStockMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/transactions/stock-movements"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/transactions/metrics"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionPatterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/transactions/patterns"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionClusters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/transactions/clusters"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionFlow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/transactions/flow"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Performance Analytics
  const getRealTimeMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/performance/metrics"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPerformanceTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/performance/trends"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSystemHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/performance/health"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getResourceUtilization = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/performance/resources"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Business Analytics
  const getFinancialAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/business/financial"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRevenueAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>("/api/analytics/business/revenue");
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHierarchicalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/business/hierarchical"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getForecastData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>(
        "/api/analytics/business/forecast"
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTrendPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.get<ChartData>("/api/analytics/business/trends");
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    // Inventory Analytics
    getStockLevelTrends,
    getInventoryDistribution,
    getWarehouseDistribution,
    getReorderPoints,
    // Order Analytics
    getOrderFlow,
    getOrderPipeline,
    getOrderLifecycle,
    getOrderVolumeTrends,
    getOrderValueDistribution,
    getOrderPeakTimes,
    // Transaction Analytics
    getTransactionVolume,
    getStockMovements,
    getTransactionMetrics,
    getTransactionPatterns,
    getTransactionClusters,
    getTransactionFlow,
    // Performance Analytics
    getRealTimeMetrics,
    getPerformanceTrends,
    getSystemHealth,
    getResourceUtilization,
    // Business Analytics
    getFinancialAnalytics,
    getRevenueAnalysis,
    getHierarchicalData,
    getForecastData,
    getTrendPredictions,
  };
};
