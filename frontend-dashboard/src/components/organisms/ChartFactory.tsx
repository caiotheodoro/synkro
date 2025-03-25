import React from "react";
import * as d3 from "d3";
import { LineChart } from "../molecules/LineChart";
import { PieChart } from "../molecules/PieChart";
import { BarChart } from "../molecules/BarChart";
import { ChartTitle } from "../atoms/ChartTitle";
import { Legend } from "../atoms/Legend";
import { NoDataDisplay } from "../atoms/NoDataDisplay";
import { ChartBuilder } from "@/utils/ChartBuilder";
import { ChartData, ChartConfig } from "@/types/chart";

export interface ChartFactoryProps extends ChartConfig {
  data: ChartData;
}

export const ChartFactory: React.FC<ChartFactoryProps> = ({
  data,
  ...config
}) => {
  const chartBuilder = new ChartBuilder(data, config);

  if (!data.data?.length) {
    const { width, height } = chartBuilder.getChartDimensions();
    return (
      <NoDataDisplay
        width={width}
        height={height}
        className={config.className}
      />
    );
  }

  const renderChart = () => {
    const { metadata } = data;
    const { width, height } = chartBuilder.getChartDimensions();
    const colors = chartBuilder.getColorPalette();

    switch (metadata.type) {
      case "line":
        return (
          <LineChart
            data={data.data}
            xKey={metadata.xAxis ?? "x"}
            yKey={metadata.yAxis ?? "y"}
            width={width}
            height={height}
            colors={colors}
          />
        );

      case "area":
        return (
          <LineChart
            data={data.data}
            xKey={metadata.xAxis ?? "x"}
            yKey={metadata.yAxis ?? "y"}
            width={width}
            height={height}
            colors={colors}
            curve={d3.curveMonotoneX}
          />
        );

      case "bar":
      case "stacked-bar":
      case "horizontal-bar":
        return (
          <BarChart
            data={data.data}
            xKey={metadata.xAxis ?? "x"}
            yKey={metadata.yAxis || metadata.metrics || "y"}
            width={width}
            height={height}
            colors={colors}
            stacked={metadata.type === "stacked-bar"}
            horizontal={metadata.type === "horizontal-bar"}
          />
        );

      case "pie":
      case "donut":
        return (
          <PieChart
            data={data.data}
            nameKey={metadata.dimension ?? "dimension"}
            valueKey={metadata.metric ?? "value"}
            width={width}
            height={height}
            colors={colors}
            innerRadius={
              metadata.type === "donut" ? Math.min(width, height) / 6 : 0
            }
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Chart type "{metadata.type}" not implemented yet
            </p>
          </div>
        );
    }
  };

  const {
    title,
    subtitle,
    showLegend = true,
    legendPosition = "bottom",
    className = "",
  } = config;
  const legendItems = chartBuilder.generateLegendItems();

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
