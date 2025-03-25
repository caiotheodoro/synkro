import React from "react";
import { Arc } from "d3";

export interface PieSliceProps {
  data: any;
  arc: Arc<any, any>;
  fill: string;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

export const PieSlice: React.FC<PieSliceProps> = ({
  data,
  arc,
  fill,
  onMouseEnter,
  onMouseLeave,
}) => (
  <path
    d={arc(data) || ""}
    fill={fill}
    stroke="#fff"
    strokeWidth={2}
    style={{ cursor: "pointer" }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  />
);
