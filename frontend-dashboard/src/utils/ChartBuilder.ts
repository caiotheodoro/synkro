import { ChartData, ChartConfig, LegendItem } from "../types/chart";

export class ChartBuilder {
  private data: ChartData;
  private config: ChartConfig;
  private defaultColors = [
    "#ff5470", // primary
    "#6bf178", // accent
    "#ffe74c", // secondary
    "#5364ff",
    "#9b5de5",
    "#00bbf9",
    "#00f5d4",
  ];

  constructor(data: ChartData, config: ChartConfig = {}) {
    this.data = data;
    this.config = config;
  }

  getChartDimensions() {
    return {
      width: this.config.width || 600,
      height: this.config.height || 400,
    };
  }

  getColorPalette() {
    return this.config.colorPalette || this.defaultColors;
  }

  private getSeriesNames(): string[] {
    const { metadata } = this.data;

    if (metadata.type === "pie" || metadata.type === "donut") {
      // For pie charts, we use the dimension field to get category names
      const dimensionKey = metadata.dimension || "dimension";
      return this.data.data.map((item) => item[dimensionKey]) as string[];
    }

    if (metadata.yAxis && Array.isArray(metadata.yAxis)) {
      // For charts with multiple series (like multi-line or multi-bar)
      return metadata.yAxis;
    }

    if (metadata.metrics && Array.isArray(metadata.metrics)) {
      // Alternative way to specify multiple series
      return metadata.metrics;
    }

    if (metadata.yAxis && typeof metadata.yAxis === "string") {
      // Single series charts
      return [metadata.yAxis];
    }

    // Fallback for unknown chart types
    return ["value"];
  }

  generateLegendItems(): LegendItem[] {
    const seriesNames = this.getSeriesNames();
    const colors = this.getColorPalette();

    return seriesNames.map((name, index) => ({
      name,
      color: colors[index % colors.length],
    }));
  }

  /**
   * Formats data for specific chart types if needed
   */
  getProcessedData() {
    const { type } = this.data.metadata;

    // Return raw data for most chart types
    return this.data.data;
  }
}
