import React, { useEffect, useState } from "react";
import AnalyticsLayout from "./layout";
import { D3Chart } from "@/components/charts/D3Chart";
import { useAnalytics } from "@/hooks";

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

const PerformanceAnalytics: React.FC = () => {
  const [realTimeMetrics, setRealTimeMetrics] = useState<ChartData | null>(
    null
  );
  const [trends, setTrends] = useState<ChartData | null>(null);
  const [health, setHealth] = useState<ChartData | null>(null);
  const [resources, setResources] = useState<ChartData | null>(null);

  const {
    loading,
    error,
    getRealTimeMetrics,
    getPerformanceTrends,
    getSystemHealth,
    getResourceUtilization,
  } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, trendsData, healthData, resourcesData] =
          await Promise.all([
            getRealTimeMetrics(),
            getPerformanceTrends(),
            getSystemHealth(),
            getResourceUtilization(),
          ]);

        setRealTimeMetrics(metricsData);
        setTrends(trendsData);
        setHealth(healthData);
        setResources(resourcesData);
      } catch (error) {
        console.error("Error fetching performance analytics:", error);
      }
    };

    fetchData();
  }, [
    getRealTimeMetrics,
    getPerformanceTrends,
    getSystemHealth,
    getResourceUtilization,
  ]);

  if (error) {
    return (
      <AnalyticsLayout>
        <div className="text-red-500">
          Error loading analytics data: {error.message}
        </div>
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Performance Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Real-Time Metrics</h3>
              {loading && !realTimeMetrics ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : realTimeMetrics ? (
                <D3Chart data={realTimeMetrics} height={300} />
              ) : null}
              <div className="mt-4 text-sm text-gray-600">
                Displaying real-time order metrics and completion rates.
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Performance Trends</h3>
              {loading && !trends ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : trends ? (
                <D3Chart data={trends} height={300} />
              ) : null}
              <div className="mt-4 text-sm text-gray-600">
                Showing trends in order volume and completion rates over time.
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">System Health</h3>
              {loading && !health ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : health ? (
                <D3Chart data={health} height={300} />
              ) : null}
              <div className="mt-4 text-sm text-gray-600">
                Monitoring system health and order processing status.
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Resource Utilization</h3>
              {loading && !resources ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : resources ? (
                <D3Chart data={resources} height={300} />
              ) : null}
              <div className="mt-4 text-sm text-gray-600">
                Tracking resource usage and efficiency metrics.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default PerformanceAnalytics;
