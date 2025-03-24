import React, { useEffect, useState } from "react";
import AnalyticsLayout from "./layout";
import { D3Chart } from "@/components/builders/D3Chart";
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

const InventoryAnalytics: React.FC = () => {
  const [stockTrends, setStockTrends] = useState<ChartData | null>(null);
  const [distribution, setDistribution] = useState<ChartData | null>(null);
  const [warehouseDistribution, setWarehouseDistribution] =
    useState<ChartData | null>(null);
  const [reorderPoints, setReorderPoints] = useState<ChartData | null>(null);

  const {
    loading,
    error,
    getStockLevelTrends,
    getInventoryDistribution,
    getWarehouseDistribution,
    getReorderPoints,
  } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          stockTrendsData,
          distributionData,
          warehouseDistData,
          reorderPointsData,
        ] = await Promise.all([
          getStockLevelTrends(),
          getInventoryDistribution(),
          getWarehouseDistribution(),
          getReorderPoints(),
        ]);

        setStockTrends(stockTrendsData);
        setDistribution(distributionData);
        setWarehouseDistribution(warehouseDistData);
        setReorderPoints(reorderPointsData);
      } catch (error) {
        console.error("Error fetching inventory analytics:", error);
      }
    };

    fetchData();
  }, [
    getStockLevelTrends,
    getInventoryDistribution,
    getWarehouseDistribution,
    getReorderPoints,
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
          <h2 className="text-2xl font-bold mb-6">Inventory Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Stock Level Trends</h3>
              {loading && !stockTrends ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : stockTrends ? (
                <D3Chart data={stockTrends} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Reorder Point Analysis</h3>
              {loading && !reorderPoints ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : reorderPoints ? (
                <D3Chart data={reorderPoints} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Category Distribution</h3>
              {loading && !distribution ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : distribution ? (
                <D3Chart data={distribution} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Warehouse Distribution</h3>
              {loading && !warehouseDistribution ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : warehouseDistribution ? (
                <D3Chart data={warehouseDistribution} height={300} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default InventoryAnalytics;
