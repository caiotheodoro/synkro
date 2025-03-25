import * as d3 from "d3";

export interface PieChartConfig {
  width: number;
  height: number;
  innerRadius: number;
  padAngle: number;
  cornerRadius: number;
  colors: d3.ScaleOrdinal<string, string> | Array<string>;
}

export class PieChartBuilder {
  private colorScale: d3.ScaleOrdinal<string, string>;
  private pie: d3.Pie<any, any>;
  private arc: d3.Arc<any, any>;
  private total: number;
  private chartRadius: number;

  constructor(
    private data: any[],
    private nameKey: string,
    private valueKey: string,
    private config: PieChartConfig
  ) {
    this.chartRadius = Math.min(config.width, config.height) / 2;
    this.colorScale = this.createColorScale();
    this.pie = this.createPie();
    this.arc = this.createArc();
    this.total = this.calculateTotal();
  }

  private createColorScale() {
    return typeof this.config.colors === "function"
      ? this.config.colors
      : d3
          .scaleOrdinal<string>()
          .domain(this.data.map((d) => d[this.nameKey]))
          .range(this.config.colors);
  }

  private createPie() {
    return d3
      .pie<any>()
      .value((d) => d[this.valueKey])
      .sort(null);
  }

  private createArc() {
    return d3
      .arc<any>()
      .innerRadius(this.config.innerRadius)
      .outerRadius(this.chartRadius - 10)
      .padAngle(this.config.padAngle)
      .cornerRadius(this.config.cornerRadius);
  }

  private calculateTotal() {
    return this.data.reduce((sum, d) => sum + Number(d[this.valueKey] || 0), 0);
  }

  getPieData() {
    return this.pie(this.data);
  }

  getArc() {
    return this.arc;
  }

  getColorScale() {
    return this.colorScale;
  }

  getTotal() {
    return this.total;
  }

  getChartRadius() {
    return this.chartRadius;
  }

  calculatePercentage(value: number) {
    return this.total > 0
      ? ((value / this.total) * 100).toFixed(1) + "%"
      : "0%";
  }
}
