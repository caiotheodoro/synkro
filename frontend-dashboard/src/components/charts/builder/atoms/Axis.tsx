import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface AxisProps {
  scale: d3.AxisScale<any>;
  orient: "top" | "right" | "bottom" | "left";
  transform?: string;
  tickFormat?: (domainValue: any) => string;
  ticks?: number;
  tickSize?: number;
  tickPadding?: number;
  className?: string;
}

export const Axis: React.FC<AxisProps> = ({
  scale,
  orient,
  transform,
  tickFormat,
  ticks = 5,
  tickSize = 6,
  tickPadding = 3,
  className = "",
}) => {
  const axisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!axisRef.current) return;

    let axis;
    switch (orient) {
      case "top":
        axis = d3.axisTop(scale);
        break;
      case "right":
        axis = d3.axisRight(scale);
        break;
      case "bottom":
        axis = d3.axisBottom(scale);
        break;
      case "left":
        axis = d3.axisLeft(scale);
        break;
    }

    if (tickFormat) {
      axis.tickFormat(tickFormat);
    }

    axis.ticks(ticks).tickSize(tickSize).tickPadding(tickPadding);

    d3.select(axisRef.current).call(axis);
  }, [scale, orient, ticks, tickSize, tickPadding, tickFormat]);

  return (
    <g
      ref={axisRef}
      transform={transform}
      className={`chart-axis chart-axis-${orient} ${className}`}
    />
  );
};
