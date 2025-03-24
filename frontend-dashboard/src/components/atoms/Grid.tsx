import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface GridProps {
  scale: d3.AxisScale<any>;
  direction: "horizontal" | "vertical";
  ticks?: number;
  size: number;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  scale,
  direction,
  ticks = 5,
  size,
  className = "",
}) => {
  const gridRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    const gridAxis =
      direction === "horizontal"
        ? d3
            .axisLeft(scale)
            .tickSize(-size)
            .tickFormat(() => "")
            .ticks(ticks)
        : d3
            .axisBottom(scale)
            .tickSize(-size)
            .tickFormat(() => "")
            .ticks(ticks);

    d3.select(gridRef.current)
      .call(gridAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", "#e2e8f0")
          .attr("stroke-opacity", 0.7)
          .attr("stroke-dasharray", "2,2")
      );
  }, [scale, direction, ticks, size]);

  return (
    <g
      ref={gridRef}
      className={`chart-grid chart-grid-${direction} ${className}`}
    />
  );
};
