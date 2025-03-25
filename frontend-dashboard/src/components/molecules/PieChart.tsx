import React, { useRef, useState } from "react";
import * as d3 from "d3";
import { Tooltip, TooltipContent } from "../atoms/Tooltip";
import { PieSlice } from "../atoms/PieSlice";
import { PieChartBuilder } from "@/utils/PieChartBuilder";

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
  colors = [...d3.schemeCategory10],
  showTooltip = true,
  valueFormat,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

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

  const chartBuilder = new PieChartBuilder(data, nameKey, valueKey, {
    width,
    height,
    innerRadius,
    padAngle,
    cornerRadius,
    colors,
  });

  const pieData = chartBuilder.getPieData();
  const arc = chartBuilder.getArc();
  const colorScale = chartBuilder.getColorScale();

  const handleSliceHover = (event: React.MouseEvent, data: any) => {
    const [mouseX, mouseY] = d3.pointer(event);
    setTooltipData({
      visible: true,
      x: mouseX + width / 2,
      y: mouseY + height / 2,
      data,
    });
  };

  const handleSliceLeave = () => {
    setTooltipData((prev) => ({ ...prev, visible: false }));
  };

  const formatValue = (value: any) => valueFormat?.(value) ?? String(value);

  return (
    <div className={`relative pie-chart ${className}`}>
      <svg ref={svgRef} width={width} height={height}>
        <g transform={`translate(${width / 2},${height / 2})`}>
          {pieData.map((d) => (
            <PieSlice
              key={d.data[nameKey]}
              data={d}
              arc={arc}
              fill={colorScale(d.data[nameKey])}
              onMouseEnter={(e) => handleSliceHover(e, d.data)}
              onMouseLeave={handleSliceLeave}
            />
          ))}
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
                  value: chartBuilder.calculatePercentage(
                    Number(tooltipData.data[valueKey] || 0)
                  ),
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
