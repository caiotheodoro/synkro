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

const BusinessAnalytics: React.FC = () => {
  const [financial, setFinancial] = useState<ChartData | null>(null);
  const [revenue, setRevenue] = useState<ChartData | null>(null);
  const [hierarchical, setHierarchical] = useState<ChartData | null>(null);
  const [forecast, setForecast] = useState<ChartData | null>(null);
  const [trends, setTrends] = useState<ChartData | null>(null);

  const {
    loading,
    error,
    getFinancialAnalytics,
    getRevenueAnalysis,
    getHierarchicalData,
    getForecastData,
    getTrendPredictions,
  } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          financialData,
          revenueData,
          hierarchicalData,
          forecastData,
          trendsData,
        ] = await Promise.all([
          getFinancialAnalytics(),
          getRevenueAnalysis(),
          getHierarchicalData(),
          getForecastData(),
          getTrendPredictions(),
        ]);

        setFinancial(financialData);
        setRevenue(revenueData);
        setHierarchical(hierarchicalData);
        setForecast(forecastData);
        setTrends(trendsData);
      } catch (error) {
        console.error("Error fetching business analytics:", error);
      }
    };

    fetchData();
  }, [
    getFinancialAnalytics,
    getRevenueAnalysis,
    getHierarchicalData,
    getForecastData,
    getTrendPredictions,
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
          <h2 className="text-2xl font-bold mb-6">Business Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Financial Overview</h3>
              {loading && !financial ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : financial ? (
                <D3Chart data={financial} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Revenue Analysis</h3>
              {loading && !revenue ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : revenue ? (
                <D3Chart data={revenue} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Data Hierarchy</h3>
              {loading && !hierarchical ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : hierarchical ? (
                <D3Chart data={hierarchical} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Forecast</h3>
              {loading && !forecast ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : forecast ? (
                <D3Chart data={forecast} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo lg:col-span-2">
              <h3 className="text-xl font-bold mb-4">Trend Predictions</h3>
              {loading && !trends ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : trends ? (
                <D3Chart data={trends} height={300} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default BusinessAnalytics;
