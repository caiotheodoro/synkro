import { ChartData, ChartConfig, LegendItem } from "../types/chart";

export class ChartBuilder {
  private readonly colorPalette = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#14b8a6",
    "#f97316",
    "#6366f1",
  ];

  constructor(
    private readonly data: ChartData,
    private readonly config: ChartConfig = {}
  ) {}

  public generateLegendItems(): LegendItem[] {
    const { metadata } = this.data;
    const { type } = metadata;

    switch (type) {
      case "pie":
      case "donut":
        return this.generatePieLegend();
      case "line":
      case "area":
        return this.generateLineLegend();
      case "bar":
      case "stacked-bar":
      case "horizontal-bar":
        return this.generateBarLegend();
      default:
        return [];
    }
  }

  private generatePieLegend(): LegendItem[] {
    const { metadata, data } = this.data;
    const dimensionKey = metadata.dimension || "dimension";
    const metricKey = metadata.metric || "value";

    return data.map((item, index) => ({
      color: this.colorPalette[index % this.colorPalette.length],
      label: String(item[dimensionKey]),
      value: item[metricKey],
    }));
  }

  private generateLineLegend(): LegendItem[] {
    const { metadata } = this.data;
    const yKeys = Array.isArray(metadata.yAxis)
      ? metadata.yAxis
      : metadata.yAxis
      ? [metadata.yAxis]
      : [];

    return yKeys.map((key, index) => ({
      color: this.colorPalette[index % this.colorPalette.length],
      label: String(key),
    }));
  }

  private generateBarLegend(): LegendItem[] {
    const { metadata } = this.data;

    if (metadata.groupBy) {
      const groupKey = metadata.groupBy;
      const uniqueGroups = Array.from(
        new Set(this.data.data.map((item) => item[groupKey]))
      );

      return uniqueGroups.map((group, index) => ({
        color: this.colorPalette[index % this.colorPalette.length],
        label: String(group),
      }));
    }

    if (Array.isArray(metadata.yAxis)) {
      return metadata.yAxis.map((key, index) => ({
        color: this.colorPalette[index % this.colorPalette.length],
        label: String(key),
      }));
    }

    return [];
  }

  public getChartDimensions() {
    const { height = 400, width = 600, title, showLegend = true } = this.config;
    const titleHeight = title ? 70 : 0;
    const legendHeight = showLegend ? 50 : 0;

    return {
      width,
      height: height - titleHeight - legendHeight,
    };
  }

  public getColorPalette() {
    return this.colorPalette;
  }

  public getData() {
    return this.data;
  }

  public getConfig() {
    return this.config;
  }
}
