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
    source?: string;
    target?: string;
  };
}

const OrderAnalytics: React.FC = () => {
  const [orderFlow, setOrderFlow] = useState<ChartData | null>(null);
  const [orderLifecycle, setOrderLifecycle] = useState<ChartData | null>(null);
  const [volumeTrends, setVolumeTrends] = useState<ChartData | null>(null);
  const [valueDistribution, setValueDistribution] = useState<ChartData | null>(
    null
  );
  const [peakTimes, setPeakTimes] = useState<ChartData | null>(null);

  const {
    loading,
    error,
    getOrderFlow,
    getOrderLifecycle,
    getOrderVolumeTrends,
    getOrderValueDistribution,
    getOrderPeakTimes,
  } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [flowData, lifecycleData, volumeData, valueData, peakData] =
          await Promise.all([
            getOrderFlow(),
            getOrderLifecycle(),
            getOrderVolumeTrends(),
            getOrderValueDistribution(),
            getOrderPeakTimes(),
          ]);

        console.log("Order Flow Data:", JSON.stringify(flowData, null, 2));
        console.log(
          "Order Lifecycle Data:",
          JSON.stringify(lifecycleData, null, 2)
        );
        console.log("Volume Trends Data:", JSON.stringify(volumeData, null, 2));
        console.log(
          "Value Distribution Data:",
          JSON.stringify(valueData, null, 2)
        );
        console.log("Peak Times Data:", JSON.stringify(peakData, null, 2));

        setOrderFlow(flowData);
        setOrderLifecycle(lifecycleData);
        setVolumeTrends(volumeData);
        setValueDistribution(valueData);
        setPeakTimes(peakData);
      } catch (error) {
        console.error("Error fetching order analytics:", error);
      }
    };

    fetchData();
  }, [
    getOrderFlow,
    getOrderLifecycle,
    getOrderVolumeTrends,
    getOrderValueDistribution,
    getOrderPeakTimes,
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
          <h2 className="text-2xl font-bold mb-6">Order Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Order Flow Analysis
                </h3>
                <div className="relative bg-white p-4 rounded-lg shadow-sm">
                  {loading && !orderFlow ? (
                    <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
                  ) : orderFlow ? (
                    <D3Chart data={orderFlow} height={300} width={500} />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Order Lifecycle</h3>
              {loading && !orderLifecycle ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : orderLifecycle ? (
                <D3Chart data={orderLifecycle} height={250} width={500} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Volume Trends</h3>
              {loading && !volumeTrends ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : volumeTrends ? (
                <D3Chart data={volumeTrends} height={250} width={500} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Value Distribution</h3>
              {loading && !valueDistribution ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : valueDistribution ? (
                <D3Chart
                  data={valueDistribution}
                  height={250}
                  width={500}
                  className="value-distribution-chart"
                />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo lg:col-span-2">
              <h3 className="text-xl font-bold mb-4">Peak Order Times</h3>
              {loading && !peakTimes ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : peakTimes ? (
                <D3Chart data={peakTimes} height={250} width={800} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default OrderAnalytics;
