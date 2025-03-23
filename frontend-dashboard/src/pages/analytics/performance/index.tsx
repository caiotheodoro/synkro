import React from "react";
import AnalyticsLayout from "../layout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ChartBuilder } from "@/components/charts/builder";

const PerformanceAnalytics: React.FC = () => {
  const analytics = useAnalytics();

  return (
    <AnalyticsLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Performance Analytics</h2>
          <p className="text-gray-600 mb-6">
            Track system performance, health, and resource utilization metrics.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartBuilder
              title="Real-time Metrics"
              subtitle="Current system performance"
              dataSource={analytics.getRealTimeMetrics}
              refreshInterval={10000} // Refresh every 10 seconds
              height={350}
            />

            <ChartBuilder
              title="Performance Trends"
              subtitle="Historical performance data"
              dataSource={analytics.getPerformanceTrends}
              height={350}
            />

            <ChartBuilder
              title="System Health"
              subtitle="Current system health status"
              dataSource={analytics.getSystemHealth}
              height={350}
            />

            <ChartBuilder
              title="Resource Utilization"
              subtitle="CPU, Memory and Storage usage"
              dataSource={analytics.getResourceUtilization}
              height={350}
            />
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default PerformanceAnalytics;
