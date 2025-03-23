import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { Axis } from "../atoms/Axis";
import { Grid } from "../atoms/Grid";
import { Tooltip, TooltipContent } from "../atoms/Tooltip";

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

  // Convert yKey to array if it's a string
  const yKeys = Array.isArray(yKey) ? yKey : [yKey];

  // Parse data if necessary (for dates, etc.)
  const parsedData = data.map((d) => {
    let item = { ...d };
    // Convert date strings to Date objects if needed
    if (typeof d[xKey] === "string" && d[xKey].match(/^\d{4}-\d{2}-\d{2}/)) {
      item[xKey] = new Date(d[xKey]);
    }
    return item;
  });

  // Create scales
  const xScale = (() => {
    const firstValue = parsedData[0]?.[xKey];
    if (firstValue instanceof Date) {
      return d3
        .scaleTime()
        .domain(d3.extent(parsedData, (d) => d[xKey]) as [Date, Date])
        .range([0, contentWidth])
        .nice();
    }
    return d3
      .scalePoint()
      .domain(parsedData.map((d) => d[xKey]))
      .range([0, contentWidth])
      .padding(0.2);
  })();

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      (d3.max(parsedData, (d) =>
        Math.max(...yKeys.map((key) => Number(d[key] || 0)))
      ) as number) * 1.1,
    ])
    .range([contentHeight, 0])
    .nice();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear previous elements
    svg.select(".lines-group").selectAll("*").remove();

    // Lines group
    const linesGroup = svg.select(".lines-group");

    // Create line generators for each yKey
    yKeys.forEach((key, i) => {
      const line = d3
        .line<any>()
        .x((d) => xScale(d[xKey]) as number)
        .y((d) => yScale(Number(d[key] || 0)))
        .curve(curve);

      linesGroup
        .append("path")
        .datum(
          parsedData.filter((d) => d[key] !== undefined && d[key] !== null)
        )
        .attr("fill", "none")
        .attr("stroke", colors[i % colors.length])
        .attr("stroke-width", 3)
        .attr("d", line);
    });

    // Add dots for each point
    if (showTooltip) {
      const dotsGroup = svg.select(".dots-group");
      dotsGroup.selectAll("*").remove();

      yKeys.forEach((key, keyIndex) => {
        const validData = parsedData.filter(
          (d) => d[key] !== undefined && d[key] !== null
        );

        dotsGroup
          .selectAll(`.dot-${keyIndex}`)
          .data(validData)
          .join("circle")
          .attr("class", `dot-${keyIndex}`)
          .attr("cx", (d) => xScale(d[xKey]) as number)
          .attr("cy", (d) => yScale(Number(d[key] || 0)))
          .attr("r", 4)
          .attr("fill", colors[keyIndex % colors.length])
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("mouseenter", (event, d) => {
            const [mouseX, mouseY] = d3.pointer(event);
            setTooltipData({
              visible: true,
              x: mouseX + margin.left,
              y: mouseY + margin.top,
              data: { ...d, key },
            });
          })
          .on("mouseleave", () => {
            setTooltipData((prev) => ({ ...prev, visible: false }));
          });
      });
    }
  }, [
    parsedData,
    xKey,
    yKeys,
    xScale,
    yScale,
    colors,
    curve,
    showTooltip,
    margin,
  ]);

  // Format values for display
  const formatX = (value: any) => {
    if (xFormat) return xFormat(value);
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  const formatY = (value: any) => {
    if (yFormat) return yFormat(value);
    return String(value);
  };

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

          <g className="lines-group"></g>
          <g className="dots-group"></g>
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
