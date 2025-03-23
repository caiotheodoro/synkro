import React from "react";

export interface LegendItem {
  color: string;
  label: string;
  value?: number | string;
}

export interface LegendProps {
  items: LegendItem[];
  orientation?: "horizontal" | "vertical";
  position?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export const Legend: React.FC<LegendProps> = ({
  items,
  orientation = "horizontal",
  position = "bottom",
  className = "",
}) => {
  if (!items.length) return null;

  return (
    <div className={`chart-legend chart-legend-${position} ${className}`}>
      <ul
        className={`flex ${
          orientation === "vertical"
            ? "flex-col space-y-2"
            : "flex-row flex-wrap space-x-4"
        } text-sm`}
      >
        {items.map((item, i) => (
          <li key={i} className="flex items-center">
            <span
              className="inline-block w-3 h-3 mr-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="legend-label">{item.label}</span>
            {item.value !== undefined && (
              <span className="ml-1 text-gray-500">({item.value})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
