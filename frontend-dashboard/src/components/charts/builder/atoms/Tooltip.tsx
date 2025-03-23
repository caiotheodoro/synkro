import React, { ReactNode } from "react";

export interface TooltipProps {
  content: ReactNode;
  visible: boolean;
  x: number;
  y: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  visible,
  x,
  y,
  className = "",
}) => {
  if (!visible) return null;

  return (
    <div
      className={`absolute z-50 p-2 text-sm bg-white border-[3px] border-black shadow-neo-sm min-w-[120px] rounded-lg ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -100%)",
        pointerEvents: "none",
      }}
    >
      {content}
      <div
        className="absolute w-3 h-3 rotate-45 bg-white border-r-[3px] border-b-[3px] border-black"
        style={{
          left: "50%",
          marginLeft: "-6px",
          bottom: "-6px",
        }}
      ></div>
    </div>
  );
};

export interface TooltipContentProps {
  title?: string;
  items: {
    label: string;
    value: string | number;
    color?: string;
  }[];
}

export const TooltipContent: React.FC<TooltipContentProps> = ({
  title,
  items,
}) => {
  return (
    <div>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {item.color && (
              <span
                className="inline-block w-2 h-2 mr-2 rounded-sm"
                style={{ backgroundColor: item.color }}
              ></span>
            )}
            <span className="text-gray-500">{item.label}:</span>
            <span className="font-medium ml-1">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
