import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { Axis } from "../atoms/Axis";
import { Grid } from "../atoms/Grid";
import { Tooltip, TooltipContent } from "../atoms/Tooltip";

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

  // Validate that stacked and grouped aren't both true
  if (stacked && grouped) {
    console.warn(
      "Both stacked and grouped are set to true; defaulting to stacked"
    );
    grouped = false;
  }

  // Convert yKey to array if it's a string
  const yKeys = Array.isArray(yKey) ? yKey : [yKey];

  // Create scales based on orientation
  const mainScale = d3
    .scaleBand()
    .domain(data.map((d) => String(d[xKey])))
    .range(horizontal ? [0, contentHeight] : [0, contentWidth])
    .padding(barPadding);

  // For grouped bars
  const groupScale = grouped
    ? d3
        .scaleBand()
        .domain(yKeys)
        .range([0, mainScale.bandwidth()])
        .padding(0.05)
    : null;

  // Value scale for the bars
  const valueScale = d3
    .scaleLinear()
    .domain([
      0,
      stacked
        ? (d3.max(data, (d) =>
            yKeys.reduce((sum, key) => sum + Number(d[key] || 0), 0)
          ) as number) * 1.1
        : (d3.max(data, (d) =>
            d3.max(yKeys, (key) => Number(d[key] || 0))
          ) as number) * 1.1,
    ])
    .range(horizontal ? [0, contentWidth] : [contentHeight, 0])
    .nice();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear previous elements
    svg.select(".bars-group").selectAll("*").remove();

    const barsGroup = svg.select(".bars-group");

    if (stacked) {
      // Draw stacked bars
      const stackGenerator = d3.stack().keys(yKeys);
      const stackedData = stackGenerator(
        data.map((d) => {
          const item: { [key: string]: any } = { [xKey]: d[xKey] };
          yKeys.forEach((key) => {
            item[key] = Number(d[key] || 0);
          });
          return item;
        })
      );

      const stackGroups = barsGroup
        .selectAll("g")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", (d, i) => colors[i % colors.length]);

      if (horizontal) {
        stackGroups
          .selectAll("rect")
          .data((d) => d)
          .join("rect")
          .attr("y", (d) => mainScale(String(d.data[xKey])) as number)
          .attr("x", (d) => valueScale(d[0]))
          .attr("height", mainScale.bandwidth())
          .attr("width", (d) =>
            Math.max(0, valueScale(d[1]) - valueScale(d[0]))
          )
          .attr("rx", 3)
          .attr("ry", 3)
          .style("cursor", "pointer");
      } else {
        stackGroups
          .selectAll("rect")
          .data((d) => d)
          .join("rect")
          .attr("x", (d) => mainScale(String(d.data[xKey])) as number)
          .attr("y", (d) => valueScale(d[1]))
          .attr("width", mainScale.bandwidth())
          .attr("height", (d) =>
            Math.max(0, valueScale(d[0]) - valueScale(d[1]))
          )
          .attr("rx", 3)
          .attr("ry", 3)
          .style("cursor", "pointer");
      }

      if (showTooltip) {
        stackGroups
          .selectAll("rect")
          .on("mouseenter", (event, d: any) => {
            const [mouseX, mouseY] = d3.pointer(event);
            const stackKey = d3
              .select((event.target as Element).parentNode as Element)
              .datum() as any;
            setTooltipData({
              visible: true,
              x: mouseX + margin.left,
              y: mouseY + margin.top,
              data: {
                ...d.data,
                key: stackKey.key,
                value: d.data[stackKey.key],
              },
            });
          })
          .on("mouseleave", () => {
            setTooltipData((prev) => ({ ...prev, visible: false }));
          });
      }
    } else if (grouped) {
      // Draw grouped bars
      data.forEach((d) => {
        const xPos = mainScale(String(d[xKey])) as number;

        yKeys.forEach((key, i) => {
          const value = Number(d[key] || 0);
          const barGroup = barsGroup.append("g");

          if (horizontal) {
            barGroup
              .append("rect")
              .attr("y", xPos + (groupScale?.bandwidth() as number) * i)
              .attr("x", valueScale(0))
              .attr("height", groupScale?.bandwidth() as number)
              .attr("width", valueScale(value) - valueScale(0))
              .attr("fill", colors[i % colors.length])
              .attr("rx", 3)
              .attr("ry", 3)
              .style("cursor", "pointer");
          } else {
            barGroup
              .append("rect")
              .attr("x", xPos + (groupScale?.bandwidth() as number) * i)
              .attr("y", valueScale(value))
              .attr("width", groupScale?.bandwidth() as number)
              .attr("height", valueScale(0) - valueScale(value))
              .attr("fill", colors[i % colors.length])
              .attr("rx", 3)
              .attr("ry", 3)
              .style("cursor", "pointer");
          }

          if (showTooltip) {
            barGroup
              .selectAll("rect")
              .on("mouseenter", (event) => {
                const [mouseX, mouseY] = d3.pointer(event);
                setTooltipData({
                  visible: true,
                  x: mouseX + margin.left,
                  y: mouseY + margin.top,
                  data: {
                    ...d,
                    key,
                    value,
                  },
                });
              })
              .on("mouseleave", () => {
                setTooltipData((prev) => ({ ...prev, visible: false }));
              });
          }
        });
      });
    } else {
      // Draw simple bars
      data.forEach((d) => {
        const value = Number(d[yKeys[0]] || 0);
        const barGroup = barsGroup.append("g");

        if (horizontal) {
          barGroup
            .append("rect")
            .attr("y", mainScale(String(d[xKey])) as number)
            .attr("x", valueScale(0))
            .attr("height", mainScale.bandwidth())
            .attr("width", valueScale(value) - valueScale(0))
            .attr("fill", colors[0])
            .attr("rx", 3)
            .attr("ry", 3)
            .style("cursor", "pointer");
        } else {
          barGroup
            .append("rect")
            .attr("x", mainScale(String(d[xKey])) as number)
            .attr("y", valueScale(value))
            .attr("width", mainScale.bandwidth())
            .attr("height", valueScale(0) - valueScale(value))
            .attr("fill", colors[0])
            .attr("rx", 3)
            .attr("ry", 3)
            .style("cursor", "pointer");
        }

        if (showTooltip) {
          barGroup
            .selectAll("rect")
            .on("mouseenter", (event) => {
              const [mouseX, mouseY] = d3.pointer(event);
              setTooltipData({
                visible: true,
                x: mouseX + margin.left,
                y: mouseY + margin.top,
                data: {
                  ...d,
                  key: yKeys[0],
                  value,
                },
              });
            })
            .on("mouseleave", () => {
              setTooltipData((prev) => ({ ...prev, visible: false }));
            });
        }
      });
    }
  }, [
    data,
    xKey,
    yKeys,
    mainScale,
    valueScale,
    groupScale,
    colors,
    stacked,
    grouped,
    horizontal,
    showTooltip,
    margin,
  ]);

  // Format values for display
  const formatX = (value: any) => {
    if (xFormat) return xFormat(value);
    return String(value);
  };

  const formatY = (value: any) => {
    if (yFormat) return yFormat(value);
    return String(value);
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

          <g className="bars-group"></g>
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
