import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { Tooltip, TooltipContent } from "../atoms/Tooltip";

export interface PieChartProps {
  data: any[];
  nameKey: string;
  valueKey: string;
  width?: number;
  height?: number;
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  colors?: string[] | d3.ScaleOrdinal<string, string>;
  showTooltip?: boolean;
  valueFormat?: (value: any) => string;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  nameKey,
  valueKey,
  width = 400,
  height = 400,
  innerRadius = 0,
  padAngle = 0.01,
  cornerRadius = 3,
  colors = d3.schemeCategory10,
  showTooltip = true,
  valueFormat,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRadius = Math.min(width, height) / 2;

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

  // Create a color scale
  const colorScale =
    typeof colors === "function"
      ? colors
      : d3
          .scaleOrdinal<string>()
          .domain(data.map((d) => d[nameKey]))
          .range(colors);

  // Create pie and arc generators
  const pie = d3
    .pie<any>()
    .value((d) => d[valueKey])
    .sort(null);

  const arc = d3
    .arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(chartRadius - 10)
    .padAngle(padAngle)
    .cornerRadius(cornerRadius);

  // Calculate total value for percentage
  const total = data.reduce((sum, d) => sum + Number(d[valueKey] || 0), 0);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const pieData = pie(data);

    // Clear previous elements
    svg.select(".pie-group").selectAll("*").remove();

    // Create pie slices
    const slices = svg
      .select(".pie-group")
      .selectAll("path")
      .data(pieData)
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.data[nameKey]))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    if (showTooltip) {
      slices
        .on("mouseenter", (event, d) => {
          const [mouseX, mouseY] = d3.pointer(event);
          setTooltipData({
            visible: true,
            x: mouseX + width / 2,
            y: mouseY + height / 2,
            data: d.data,
          });
        })
        .on("mouseleave", () => {
          setTooltipData((prev) => ({ ...prev, visible: false }));
        });
    }
  }, [
    data,
    nameKey,
    valueKey,
    colorScale,
    arc,
    pie,
    showTooltip,
    width,
    height,
  ]);

  // Format value for display
  const formatValue = (value: any) => {
    if (valueFormat) return valueFormat(value);
    return String(value);
  };

  // Calculate percentage
  const getPercentage = (value: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%";
  };

  return (
    <div className={`relative pie-chart ${className}`}>
      <svg ref={svgRef} width={width} height={height}>
        <g transform={`translate(${width / 2},${height / 2})`}>
          <g className="pie-group"></g>
        </g>
      </svg>

      {showTooltip && tooltipData.visible && tooltipData.data && (
        <Tooltip
          visible={tooltipData.visible}
          x={tooltipData.x}
          y={tooltipData.y}
          content={
            <TooltipContent
              title={tooltipData.data[nameKey]}
              items={[
                {
                  label: "Value",
                  value: formatValue(tooltipData.data[valueKey]),
                  color: colorScale(tooltipData.data[nameKey]),
                },
                {
                  label: "Percentage",
                  value: getPercentage(Number(tooltipData.data[valueKey] || 0)),
                  color: colorScale(tooltipData.data[nameKey]),
                },
              ]}
            />
          }
        />
      )}
    </div>
  );
};
