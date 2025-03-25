import React, { useRef, useState } from "react";
import * as d3 from "d3";
import { Axis } from "../atoms/Axis";
import { Grid } from "../atoms/Grid";
import { Tooltip, TooltipContent } from "../atoms/Tooltip";
import { Bar } from "../atoms/Bar";
import { BarGroup } from "./BarGroup";
import { StackedBarGroup } from "./StackedBarGroup";
import { BarChartBuilder } from "@/utils/BarChartBuilder";

export interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string | string[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  barPadding?: number;
  grouped?: boolean;
  stacked?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  xFormat?: (value: any) => string;
  yFormat?: (value: any) => string;
  horizontal?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"],
  barPadding = 0.1,
  grouped = false,
  stacked = false,
  showGrid = true,
  showTooltip = true,
  xFormat,
  yFormat,
  horizontal = false,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const contentWidth = width - margin.left - margin.right;
  const contentHeight = height - margin.top - margin.bottom;

  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
  });

  if (stacked && grouped) {
    console.warn(
      "Both stacked and grouped are set to true; defaulting to stacked"
    );
    grouped = false;
  }

  const yKeys = Array.isArray(yKey) ? yKey : [yKey];

  const chartBuilder = new BarChartBuilder(data, xKey, yKeys, {
    width,
    height,
    margin,
    colors,
    barPadding,
    horizontal,
  });

  if (stacked) {
    chartBuilder.setupStacked();
  } else if (grouped) {
    chartBuilder.setupGrouped();
  } else {
    chartBuilder.setupSimple();
  }

  const { mainScale, valueScale, groupScale } = chartBuilder.getScales();

  const handleBarHover = (event: React.MouseEvent, data: any, key: string) => {
    const [mouseX, mouseY] = d3.pointer(event);
    setTooltipData({
      visible: true,
      x: mouseX + margin.left,
      y: mouseY + margin.top,
      data: { ...data, key, value: data[key] },
    });
  };

  const handleBarLeave = () => {
    setTooltipData((prev) => ({ ...prev, visible: false }));
  };

  const formatX = (value: any) => xFormat?.(value) ?? String(value);
  const formatY = (value: any) => yFormat?.(value) ?? String(value);

  const renderBars = () => {
    if (stacked) {
      return chartBuilder
        .generateStackedData()
        .map((stackData, i) => (
          <StackedBarGroup
            key={stackData.key}
            stackData={stackData}
            mainScale={mainScale}
            valueScale={valueScale}
            color={colors[i % colors.length]}
            horizontal={horizontal}
            onBarHover={handleBarHover}
            onBarLeave={handleBarLeave}
          />
        ));
    }

    if (grouped) {
      return data.map((d) => (
        <BarGroup
          key={d[xKey]}
          data={d}
          xKey={xKey}
          yKeys={yKeys}
          mainScale={mainScale}
          valueScale={valueScale}
          groupScale={groupScale!}
          colors={colors}
          horizontal={horizontal}
          onBarHover={handleBarHover}
          onBarLeave={handleBarLeave}
        />
      ));
    }

    return data.map((d) => {
      const value = Number(d[yKeys[0]] || 0);
      const barProps = {
        key: d[xKey],
        fill: colors[0],
        onMouseEnter: (e: React.MouseEvent) => handleBarHover(e, d, yKeys[0]),
        onMouseLeave: handleBarLeave,
        ...(horizontal
          ? {
              y: mainScale(String(d[xKey])) as number,
              x: valueScale(0),
              height: mainScale.bandwidth(),
              width: valueScale(value) - valueScale(0),
            }
          : {
              x: mainScale(String(d[xKey])) as number,
              y: valueScale(value),
              width: mainScale.bandwidth(),
              height: valueScale(0) - valueScale(value),
            }),
      };

      return <Bar {...barProps} />;
    });
  };

  return (
    <div className={`relative bar-chart ${className}`}>
      <svg ref={svgRef} width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {showGrid && (
            <>
              <Grid
                scale={horizontal ? mainScale : valueScale}
                direction={horizontal ? "horizontal" : "vertical"}
                size={horizontal ? contentWidth : contentHeight}
                ticks={5}
              />
              <Grid
                scale={horizontal ? valueScale : mainScale}
                direction={horizontal ? "vertical" : "horizontal"}
                size={horizontal ? contentHeight : contentWidth}
                ticks={5}
              />
            </>
          )}

          {horizontal ? (
            <>
              <Axis
                scale={valueScale}
                orient="bottom"
                transform={`translate(0,${contentHeight})`}
                tickFormat={yFormat}
              />
              <Axis scale={mainScale} orient="left" tickFormat={xFormat} />
            </>
          ) : (
            <>
              <Axis
                scale={mainScale}
                orient="bottom"
                transform={`translate(0,${contentHeight})`}
                tickFormat={xFormat}
              />
              <Axis scale={valueScale} orient="left" tickFormat={yFormat} />
            </>
          )}

          <g>{renderBars()}</g>
        </g>
      </svg>

      {showTooltip && tooltipData.visible && tooltipData.data && (
        <Tooltip
          visible={tooltipData.visible}
          x={tooltipData.x}
          y={tooltipData.y}
          content={
            <TooltipContent
              title={formatX(tooltipData.data[xKey])}
              items={[
                {
                  label: String(tooltipData.data.key),
                  value: formatY(tooltipData.data.value),
                  color:
                    colors[yKeys.indexOf(tooltipData.data.key) % colors.length],
                },
              ]}
            />
          }
        />
      )}
    </div>
  );
};
