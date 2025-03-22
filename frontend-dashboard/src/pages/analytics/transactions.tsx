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

const TransactionAnalytics: React.FC = () => {
  const [transactionVolume, setTransactionVolume] = useState<ChartData | null>(
    null
  );
  const [stockMovements, setStockMovements] = useState<ChartData | null>(null);
  const [metrics, setMetrics] = useState<ChartData | null>(null);
  const [patterns, setPatterns] = useState<ChartData | null>(null);
  const [clusters, setClusters] = useState<ChartData | null>(null);
  const [flow, setFlow] = useState<ChartData | null>(null);

  const {
    loading,
    error,
    getTransactionVolume,
    getStockMovements,
    getTransactionMetrics,
    getTransactionPatterns,
    getTransactionClusters,
    getTransactionFlow,
  } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          volumeData,
          movementsData,
          metricsData,
          patternsData,
          clustersData,
          flowData,
        ] = await Promise.all([
          getTransactionVolume(),
          getStockMovements(),
          getTransactionMetrics(),
          getTransactionPatterns(),
          getTransactionClusters(),
          getTransactionFlow(),
        ]);

        setTransactionVolume(volumeData);
        setStockMovements(movementsData);
        setMetrics(metricsData);
        setPatterns(patternsData);
        setClusters(clustersData);
        setFlow(flowData);
      } catch (error) {
        console.error("Error fetching transaction analytics:", error);
      }
    };

    fetchData();
  }, [
    getTransactionVolume,
    getStockMovements,
    getTransactionMetrics,
    getTransactionPatterns,
    getTransactionClusters,
    getTransactionFlow,
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
          <h2 className="text-2xl font-bold mb-6">Transaction Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Transaction Volume</h3>
              {loading && !transactionVolume ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : transactionVolume ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">
                      {transactionVolume.data.length > 0 && (
                        <span>
                          Showing {transactionVolume.data.length} data points
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {transactionVolume.data.length > 0 && (
                        <span className="text-blue-600">
                          Total:{" "}
                          {transactionVolume.data.reduce((sum, item) => {
                            // Get the count value accounting for possible field name variations
                            const count =
                              item.count !== undefined
                                ? item.count
                                : item.transaction_count !== undefined
                                ? item.transaction_count
                                : item.transactionCount || 0;
                            return sum + count;
                          }, 0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <D3Chart data={transactionVolume} height={300} />
                </div>
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Stock Movements</h3>
              {loading && !stockMovements ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : stockMovements ? (
                <D3Chart data={stockMovements} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Transaction Metrics</h3>
              {loading && !metrics ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : metrics ? (
                <D3Chart data={metrics} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Transaction Patterns</h3>
              {loading && !patterns ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : patterns ? (
                <D3Chart data={patterns} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Transaction Clusters</h3>
              {loading && !clusters ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : clusters ? (
                <D3Chart data={clusters} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Transaction Flow</h3>
              {loading && !flow ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : flow ? (
                <D3Chart data={flow} height={300} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default TransactionAnalytics;
