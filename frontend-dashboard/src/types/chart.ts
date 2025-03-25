export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "stacked-bar"
  | "horizontal-bar"
  | "pie"
  | "donut"
  | "gauge"
  | "sankey"
  | "funnel";

export interface ChartData {
  data: any[];
  metadata: {
    type: string;
    xAxis?: string;
    yAxis?: string | string[];
    dimension?: string;
    metric?: string;
    metrics?: string[];
    nodes?: string;
    value?: string;
    groupBy?: string;
    source?: string;
    target?: string;
  };
}

export interface ChartConfig {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  legendPosition?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export interface LegendItem {
  color: string;
  label: string;
  value?: number | string;
}
