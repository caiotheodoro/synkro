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

const OrderAnalytics: React.FC = () => {
  const [orderFlow, setOrderFlow] = useState<ChartData | null>(null);
  const [orderPipeline, setOrderPipeline] = useState<ChartData | null>(null);
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
    getOrderPipeline,
    getOrderLifecycle,
    getOrderVolumeTrends,
    getOrderValueDistribution,
    getOrderPeakTimes,
  } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          flowData,
          pipelineData,
          lifecycleData,
          volumeData,
          valueData,
          peakData,
        ] = await Promise.all([
          getOrderFlow(),
          getOrderPipeline(),
          getOrderLifecycle(),
          getOrderVolumeTrends(),
          getOrderValueDistribution(),
          getOrderPeakTimes(),
        ]);

        setOrderFlow(flowData);
        setOrderPipeline(pipelineData);
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
    getOrderPipeline,
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
              <h3 className="text-xl font-bold mb-4">Order Flow Analysis</h3>
              {loading && !orderFlow ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : orderFlow ? (
                <D3Chart data={orderFlow} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Order Pipeline</h3>
              {loading && !orderPipeline ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : orderPipeline ? (
                <D3Chart data={orderPipeline} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Order Lifecycle</h3>
              {loading && !orderLifecycle ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : orderLifecycle ? (
                <D3Chart data={orderLifecycle} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Volume Trends</h3>
              {loading && !volumeTrends ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : volumeTrends ? (
                <D3Chart data={volumeTrends} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Value Distribution</h3>
              {loading && !valueDistribution ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : valueDistribution ? (
                <D3Chart data={valueDistribution} height={300} />
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
              <h3 className="text-xl font-bold mb-4">Peak Order Times</h3>
              {loading && !peakTimes ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
              ) : peakTimes ? (
                <D3Chart data={peakTimes} height={300} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default OrderAnalytics;
