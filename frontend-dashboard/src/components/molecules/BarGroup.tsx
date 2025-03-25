import React from "react";
import { Bar } from "../atoms/Bar";
import { ScaleBand, ScaleLinear } from "d3";

export interface BarGroupProps {
  data: any;
  xKey: string;
  yKeys: string[];
  mainScale: ScaleBand<string>;
  valueScale: ScaleLinear<number, number>;
  groupScale: ScaleBand<string>;
  colors: string[];
  horizontal?: boolean;
  onBarHover?: (event: React.MouseEvent, data: any, key: string) => void;
  onBarLeave?: () => void;
}

export const BarGroup: React.FC<BarGroupProps> = ({
  data,
  xKey,
  yKeys,
  mainScale,
  valueScale,
  groupScale,
  colors,
  horizontal = false,
  onBarHover,
  onBarLeave,
}) => {
  const xPos = mainScale(String(data[xKey])) as number;

  return (
    <g>
      {yKeys.map((key, i) => {
        const value = Number(data[key] || 0);
        const groupPos = groupScale(key) as number;

        if (horizontal) {
          return (
            <Bar
              key={key}
              y={xPos + groupPos}
              x={valueScale(0)}
              height={groupScale.bandwidth()}
              width={valueScale(value) - valueScale(0)}
              fill={colors[i % colors.length]}
              onMouseEnter={(e) => onBarHover?.(e, data, key)}
              onMouseLeave={onBarLeave}
            />
          );
        }

        return (
          <Bar
            key={key}
            x={xPos + groupPos}
            y={valueScale(value)}
            width={groupScale.bandwidth()}
            height={valueScale(0) - valueScale(value)}
            fill={colors[i % colors.length]}
            onMouseEnter={(e) => onBarHover?.(e, data, key)}
            onMouseLeave={onBarLeave}
          />
        );
      })}
    </g>
  );
};
