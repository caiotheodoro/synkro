import React, { useState, useEffect } from "react";
import { ChartFactory } from "../organisms/ChartFactory";
import { ChartData } from "@/utils/chartHelpers";

export interface ChartBuilderProps {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  dataSource: (() => Promise<ChartData>) | ChartData;
  refreshInterval?: number;
  showLegend?: boolean;
  legendPosition?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * ChartBuilder - A template component that handles data fetching and rendering for charts.
 * It provides a consistent approach to working with chart data, whether it's static or fetched.
 */
export const ChartBuilder: React.FC<ChartBuilderProps> = ({
  title,
  subtitle,
  width = 600,
  height = 400,
  dataSource,
  refreshInterval,
  showLegend = true,
  legendPosition = "bottom",
  className = "",
}) => {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // If dataSource is a function, call it to get the data
      if (typeof dataSource === "function") {
        const result = await dataSource();
        setData(result);
      } else {
        // Otherwise, use the data directly
        setData(dataSource);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch chart data")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up refresh interval if specified
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchData();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [dataSource, refreshInterval]);

  if (loading && !data) {
    return (
      <div
        className={`flex items-center justify-center border-[3px] border-black rounded-lg p-6 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center border-[3px] border-black rounded-lg p-6 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-2">
            <p>Failed to load chart data</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`flex items-center justify-center border-[3px] border-black rounded-lg p-6 ${className}`}
        style={{ width, height }}
      >
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  return (
    <ChartFactory
      data={data}
      title={title}
      subtitle={subtitle}
      width={width}
      height={height}
      showLegend={showLegend}
      legendPosition={legendPosition}
      className={className}
    />
  );
};
