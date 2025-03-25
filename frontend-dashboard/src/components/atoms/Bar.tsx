import React from "react";

export interface BarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rx?: number;
  ry?: number;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
}

export const Bar: React.FC<BarProps> = ({
  x,
  y,
  width,
  height,
  fill,
  rx = 3,
  ry = 3,
  onMouseEnter,
  onMouseLeave,
}) => (
  <rect
    x={x}
    y={y}
    width={width}
    height={height}
    fill={fill}
    rx={rx}
    ry={ry}
    style={{ cursor: "pointer" }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  />
);
