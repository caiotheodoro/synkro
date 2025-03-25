import * as d3 from "d3";

export interface BarChartConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  colors: string[];
  barPadding: number;
  horizontal: boolean;
}

export class BarChartBuilder {
  private mainScale: d3.ScaleBand<string>;
  private valueScale: d3.ScaleLinear<number, number>;
  private groupScale: d3.ScaleBand<string> | null = null;

  constructor(
    private data: any[],
    private xKey: string,
    private yKeys: string[],
    private config: BarChartConfig
  ) {
    const contentWidth =
      config.width - config.margin.left - config.margin.right;
    const contentHeight =
      config.height - config.margin.top - config.margin.bottom;

    this.mainScale = d3
      .scaleBand()
      .domain(data.map((d) => String(d[xKey])))
      .range(config.horizontal ? [0, contentHeight] : [0, contentWidth])
      .padding(config.barPadding);

    this.valueScale = d3
      .scaleLinear()
      .range(config.horizontal ? [0, contentWidth] : [contentHeight, 0])
      .nice();
  }

  setupGrouped(): this {
    this.groupScale = d3
      .scaleBand()
      .domain(this.yKeys)
      .range([0, this.mainScale.bandwidth()])
      .padding(0.05);

    this.valueScale.domain([
      0,
      (d3.max(this.data, (d) =>
        d3.max(this.yKeys, (key) => Number(d[key] || 0))
      ) as number) * 1.1,
    ]);

    return this;
  }

  setupStacked(): this {
    this.valueScale.domain([
      0,
      (d3.max(this.data, (d) =>
        this.yKeys.reduce((sum, key) => sum + Number(d[key] || 0), 0)
      ) as number) * 1.1,
    ]);

    return this;
  }

  setupSimple(): this {
    this.valueScale.domain([
      0,
      (d3.max(this.data, (d) => Number(d[this.yKeys[0]] || 0)) as number) * 1.1,
    ]);

    return this;
  }

  getScales() {
    return {
      mainScale: this.mainScale,
      valueScale: this.valueScale,
      groupScale: this.groupScale,
    };
  }

  generateStackedData() {
    const stackGenerator = d3.stack().keys(this.yKeys);
    return stackGenerator(
      this.data.map((d) => {
        const item: { [key: string]: any } = { [this.xKey]: d[this.xKey] };
        this.yKeys.forEach((key) => {
          item[key] = Number(d[key] || 0);
        });
        return item;
      })
    );
  }
}
