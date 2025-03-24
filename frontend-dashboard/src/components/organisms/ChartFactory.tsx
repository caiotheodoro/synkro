import React from "react";
import * as d3 from "d3";
import { LineChart } from "../molecules/LineChart";
import { PieChart } from "../molecules/PieChart";
import { BarChart } from "../molecules/BarChart";
import { ChartTitle } from "../atoms/ChartTitle";
import { Legend, LegendItem } from "../atoms/Legend";

export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "stacked-bar"
  | "horizontal-bar"
  | "pie"
  | "donut"
  | "gauge"
  | "sankey"
  | "funnel";

// Common chart data format aligned with the app's existing structure
export interface ChartData {
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

export interface ChartFactoryProps {
  data: ChartData;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  legendPosition?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * ChartFactory - A component that renders different chart types based on the metadata.
 * This follows atomic design by using molecules (chart types) and atoms (titles, legends)
 * to build a complete chart organism.
 */
export const ChartFactory: React.FC<ChartFactoryProps> = ({
  data,
  title,
  subtitle,
  width = 600,
  height = 400,
  showLegend = true,
  legendPosition = "bottom",
  className = "",
}) => {
  const { metadata } = data;

  if (!data.data || data.data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center border-[3px] border-black rounded-lg p-6 ${className}`}
        style={{ width, height }}
      >
        <p className="text-gray-500 text-lg">No data available</p>
      </div>
    );
  }

  // Generate colors based on the type of chart
  const colorPalette = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
  ];

  // Generate legend items based on chart type
  const generateLegendItems = (): LegendItem[] => {
    const { type } = metadata;

    switch (type) {
      case "pie":
      case "donut":
        const dimensionKey = metadata.dimension || "dimension";
        const metricKey = metadata.metric || "value";
        return data.data.map((item, index) => ({
          color: colorPalette[index % colorPalette.length],
          label: String(item[dimensionKey]),
          value: item[metricKey],
        }));

      case "line":
      case "area":
        const yKeys = Array.isArray(metadata.yAxis)
          ? metadata.yAxis
          : metadata.yAxis
          ? [metadata.yAxis]
          : [];

        return yKeys.map((key, index) => ({
          color: colorPalette[index % colorPalette.length],
          label: String(key),
        }));

      case "bar":
      case "stacked-bar":
      case "horizontal-bar":
        if (metadata.groupBy) {
          // Get unique groupBy values
          const groupKey = metadata.groupBy;
          const uniqueGroups = Array.from(
            new Set(data.data.map((item) => item[groupKey]))
          );

          return uniqueGroups.map((group, index) => ({
            color: colorPalette[index % colorPalette.length],
            label: String(group),
          }));
        } else if (Array.isArray(metadata.yAxis)) {
          return metadata.yAxis.map((key, index) => ({
            color: colorPalette[index % colorPalette.length],
            label: String(key),
          }));
        }
        return [];

      default:
        return [];
    }
  };

  // Render the appropriate chart based on type
  const renderChart = () => {
    const { type } = metadata;

    switch (type) {
      case "line":
        return (
          <LineChart
            data={data.data}
            xKey={metadata.xAxis || "x"}
            yKey={metadata.yAxis || "y"}
            width={width}
            height={height - (title ? 70 : 0) - (showLegend ? 50 : 0)}
            colors={colorPalette}
          />
        );

      case "area":
        return (
          <LineChart
            data={data.data}
            xKey={metadata.xAxis || "x"}
            yKey={metadata.yAxis || "y"}
            width={width}
            height={height - (title ? 70 : 0) - (showLegend ? 50 : 0)}
            colors={colorPalette}
            curve={d3.curveMonotoneX}
            // In a real implementation, add area fill styling
          />
        );

      case "bar":
        return (
          <BarChart
            data={data.data}
            xKey={metadata.xAxis || "x"}
            yKey={metadata.yAxis || metadata.metrics || "y"}
            width={width}
            height={height - (title ? 70 : 0) - (showLegend ? 50 : 0)}
            colors={colorPalette}
          />
        );

      case "stacked-bar":
        return (
          <BarChart
            data={data.data}
            xKey={metadata.xAxis || "x"}
            yKey={
              Array.isArray(metadata.yAxis)
                ? metadata.yAxis
                : metadata.metrics || []
            }
            width={width}
            height={height - (title ? 70 : 0) - (showLegend ? 50 : 0)}
            colors={colorPalette}
            stacked={true}
          />
        );

      case "horizontal-bar":
        return (
          <BarChart
            data={data.data}
            xKey={metadata.xAxis || "x"}
            yKey={metadata.yAxis || metadata.metrics || "y"}
            width={width}
            height={height - (title ? 70 : 0) - (showLegend ? 50 : 0)}
            colors={colorPalette}
            horizontal={true}
          />
        );

      case "pie":
        return (
          <PieChart
            data={data.data}
            nameKey={metadata.dimension || "dimension"}
            valueKey={metadata.metric || "value"}
            width={width}
            height={height - (title ? 70 : 0) - (showLegend ? 50 : 0)}
            colors={colorPalette}
          />
        );

      case "donut":
        return (
          <PieChart
            data={data.data}
            nameKey={metadata.dimension || "dimension"}
            valueKey={metadata.metric || "value"}
            width={width}
            height={height - (title ? 70 : 0) - (showLegend ? 50 : 0)}
            colors={colorPalette}
            innerRadius={Math.min(width, height) / 6}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Chart type "{type}" not implemented yet
            </p>
          </div>
        );
    }
  };

  const legendItems = generateLegendItems();

  return (
    <div
      className={`chart-container bg-white p-4 border-[3px] border-black rounded-lg shadow-neo ${className}`}
    >
      {title && <ChartTitle title={title} subtitle={subtitle} />}

      <div className="chart-content">{renderChart()}</div>

      {showLegend && legendItems.length > 0 && (
        <div className="mt-4">
          <Legend items={legendItems} position={legendPosition} />
        </div>
      )}
    </div>
  );
};
