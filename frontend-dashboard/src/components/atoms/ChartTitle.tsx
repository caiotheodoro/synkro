import React from "react";

export interface ChartTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export const ChartTitle: React.FC<ChartTitleProps> = ({
  title,
  subtitle,
  align = "left",
  className = "",
}) => {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div className={`chart-title mb-4 ${alignClass} ${className}`}>
      <h3 className="text-xl font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};
