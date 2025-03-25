import * as d3 from "d3";

export interface LineChartConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  colors: string[];
  curve: d3.CurveFactory;
}

export class LineChartBuilder {
  private readonly xScale: d3.ScaleTime<number, number> | d3.ScalePoint<string>;
  private readonly yScale: d3.ScaleLinear<number, number>;
  private readonly parsedData: any[];

  constructor(
    private readonly data: any[],
    private readonly xKey: string,
    private readonly yKeys: string[],
    private readonly config: LineChartConfig
  ) {
    this.parsedData = this.parseData();
    this.xScale = this.createXScale();
    this.yScale = this.createYScale();
  }

  private parseData() {
    return this.data.map((d) => {
      let item = { ...d };
      if (
        typeof d[this.xKey] === "string" &&
        d[this.xKey].match(/^\d{4}-\d{2}-\d{2}/)
      ) {
        item[this.xKey] = new Date(d[this.xKey]);
      }
      return item;
    });
  }

  private createXScale() {
    const contentWidth =
      this.config.width - this.config.margin.left - this.config.margin.right;
    const firstValue = this.parsedData[0]?.[this.xKey];

    if (firstValue instanceof Date) {
      return d3
        .scaleTime()
        .domain(d3.extent(this.parsedData, (d) => d[this.xKey]) as [Date, Date])
        .range([0, contentWidth])
        .nice();
    }

    return d3
      .scalePoint()
      .domain(this.parsedData.map((d) => d[this.xKey]))
      .range([0, contentWidth])
      .padding(0.2);
  }

  private createYScale() {
    const contentHeight =
      this.config.height - this.config.margin.top - this.config.margin.bottom;

    return d3
      .scaleLinear()
      .domain([
        0,
        (d3.max(this.parsedData, (d) =>
          Math.max(...this.yKeys.map((key) => Number(d[key] || 0)))
        ) as number) * 1.1,
      ])
      .range([contentHeight, 0])
      .nice();
  }

  getScales() {
    return {
      xScale: this.xScale,
      yScale: this.yScale,
    };
  }

  getData() {
    return this.parsedData;
  }

  createLineGenerator(key: string) {
    return d3
      .line<any>()
      .x((d) => this.xScale(d[this.xKey]) as number)
      .y((d) => this.yScale(Number(d[key] || 0)))
      .curve(this.config.curve);
  }

  getValidDataForKey(key: string) {
    return this.parsedData.filter(
      (d) => d[key] !== undefined && d[key] !== null
    );
  }
}
