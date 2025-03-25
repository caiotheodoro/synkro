import React from "react";
import { Bar } from "../atoms/Bar";
import { ScaleBand, ScaleLinear } from "d3";

export interface StackedBarGroupProps {
  stackData: any[];
  mainScale: ScaleBand<string>;
  valueScale: ScaleLinear<number, number>;
  color: string;
  horizontal?: boolean;
  onBarHover?: (event: React.MouseEvent, data: any, key: string) => void;
  onBarLeave?: () => void;
}

export const StackedBarGroup: React.FC<StackedBarGroupProps> = ({
  stackData,
  mainScale,
  valueScale,
  color,
  horizontal = false,
  onBarHover,
  onBarLeave,
}) => {
  return (
    <g>
      {stackData.map((d: any) => {
        if (horizontal) {
          return (
            <Bar
              key={`${d.data[0]}-${d[0]}`}
              y={mainScale(String(d.data[0])) as number}
              x={valueScale(d[0])}
              height={mainScale.bandwidth()}
              width={Math.max(0, valueScale(d[1]) - valueScale(d[0]))}
              fill={color}
              onMouseEnter={(e) => onBarHover?.(e, d.data, d.key)}
              onMouseLeave={onBarLeave}
            />
          );
        }

        return (
          <Bar
            key={`${d.data[0]}-${d[0]}`}
            x={mainScale(String(d.data[0])) as number}
            y={valueScale(d[1])}
            width={mainScale.bandwidth()}
            height={Math.max(0, valueScale(d[0]) - valueScale(d[1]))}
            fill={color}
            onMouseEnter={(e) => onBarHover?.(e, d.data, d.key)}
            onMouseLeave={onBarLeave}
          />
        );
      })}
    </g>
  );
};
