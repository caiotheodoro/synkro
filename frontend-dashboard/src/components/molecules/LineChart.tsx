import React, { useState, useRef } from "react";
import * as d3 from "d3";
import { Axis } from "../atoms/Axis";
import { Grid } from "../atoms/Grid";
import { Tooltip, TooltipContent } from "../atoms/Tooltip";
import { LineChartBuilder } from "@/utils/LineChartBuilder";

export interface LineChartProps {
  data: any[];
  xKey: string;
  yKey: string | string[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  curve?: d3.CurveFactory;
  showGrid?: boolean;
  showTooltip?: boolean;
  xFormat?: (value: any) => string;
  yFormat?: (value: any) => string;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"],
  curve = d3.curveMonotoneX,
  showGrid = true,
  showTooltip = true,
  xFormat,
  yFormat,
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

  const yKeys = Array.isArray(yKey) ? yKey : [yKey];

  const chartBuilder = new LineChartBuilder(data, xKey, yKeys, {
    width,
    height,
    margin,
    colors,
    curve,
  });

  const { xScale, yScale } = chartBuilder.getScales();

  const handleDotHover = (event: MouseEvent, d: any, key: string) => {
    const [mouseX, mouseY] = d3.pointer(event);
    setTooltipData({
      visible: true,
      x: mouseX + margin.left,
      y: mouseY + margin.top,
      data: { ...d, key },
    });
  };

  const handleDotLeave = () => {
    setTooltipData((prev) => ({ ...prev, visible: false }));
  };

  const renderLines = () => {
    return yKeys.map((key, i) => {
      const validData = chartBuilder.getValidDataForKey(key);
      const line = chartBuilder.createLineGenerator(key);

      return (
        <g key={key}>
          <path
            d={line(validData) ?? ""}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth={3}
          />
          {showTooltip &&
            validData.map((d) => (
              <circle
                key={`${d[xKey]}-${key}`}
                cx={xScale(d[xKey]) as number}
                cy={yScale(Number(d[key] || 0))}
                r={4}
                fill={colors[i % colors.length]}
                stroke="#fff"
                strokeWidth={2}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => handleDotHover(e.nativeEvent, d, key)}
                onMouseLeave={handleDotLeave}
              />
            ))}
        </g>
      );
    });
  };

  const formatX = (value: any) => {
    if (xFormat) return xFormat(value);
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  const formatY = (value: any) => yFormat?.(value) ?? String(value);

  return (
    <div className={`relative line-chart ${className}`}>
      <svg ref={svgRef} width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {showGrid && (
            <>
              <Grid
                scale={xScale}
                direction="vertical"
                size={contentHeight}
                ticks={5}
              />
              <Grid
                scale={yScale}
                direction="horizontal"
                size={contentWidth}
                ticks={5}
              />
            </>
          )}

          <Axis
            scale={xScale}
            orient="bottom"
            transform={`translate(0,${contentHeight})`}
            tickFormat={xFormat}
          />

          <Axis scale={yScale} orient="left" tickFormat={yFormat} />

          {renderLines()}
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
                  value: formatY(tooltipData.data[tooltipData.data.key]),
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
