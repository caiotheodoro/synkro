import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface ChartData {
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
  };
}

interface D3ChartProps {
  data: ChartData;
  width?: number;
  height?: number;
  className?: string;
}

export const D3Chart: React.FC<D3ChartProps> = ({
  data,
  width = 600,
  height = 400,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    switch (data.metadata.type) {
      case "line":
        drawLineChart(g, data, innerWidth, innerHeight);
        break;
      case "pie":
        drawPieChart(g, data, Math.min(innerWidth, innerHeight));
        break;
      case "stacked-bar":
        drawStackedBarChart(g, data, innerWidth, innerHeight);
        break;
      case "area":
        drawAreaChart(g, data, innerWidth, innerHeight);
        break;
      case "sankey":
        drawSankeyDiagram(g, data, innerWidth, innerHeight);
        break;
      case "gauge":
        drawGaugeChart(
          g,
          data,
          Math.min(innerWidth, innerHeight),
          Math.min(innerWidth, innerHeight)
        );
        break;
      case "combo":
        drawComboChart(g, data, innerWidth, innerHeight);
        break;
      default:
        console.warn("Unsupported chart type:", data.metadata.type);
    }
  }, [data, width, height]);

  const drawLineChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;
    const xScale = d3
      .scaleTime()
      .domain(
        d3.extent(data, (d) => new Date(d[metadata.xAxis!])) as [Date, Date]
      )
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[metadata.yAxis as string])!])
      .range([height, 0]);

    const line = d3
      .line<any>()
      .x((d) => xScale(new Date(d[metadata.xAxis!])))
      .y((d) => yScale(d[metadata.yAxis as string]));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("d", line);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g").call(d3.axisLeft(yScale));
  };

  const drawPieChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    radius: number
  ) => {
    const { data, metadata } = chartData;
    const pie = d3.pie<any>().value((d) => d[metadata.metric!]);
    const arc = d3
      .arc<any>()
      .innerRadius(0)
      .outerRadius(radius / 2);

    const arcs = g
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc")
      .attr("transform", `translate(${radius / 2},${radius / 2})`);

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_, i) => d3.schemeCategory10[i]);

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text((d) => d.data[metadata.dimension!]);
  };

  const drawStackedBarChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;
    const categories = Array.from(
      new Set(data.map((d) => d[metadata.groupBy!]))
    );

    const x = d3
      .scaleBand()
      .domain(data.map((d) => String(d[metadata.xAxis!])))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[metadata.yAxis as string])!])
      .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(categories);

    const stackedData = d3.stack().keys(categories)(data);

    g.selectAll("g")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => {
        const xValue = String(d.data[metadata.xAxis!]);
        return xValue ? x(xValue) : 0;
      })
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append("g").call(d3.axisLeft(y));
  };

  const drawAreaChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;
    const xScale = d3
      .scaleTime()
      .domain(
        d3.extent(data, (d) => new Date(d[metadata.xAxis!])) as [Date, Date]
      )
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[metadata.yAxis as string])!])
      .range([height, 0]);

    const area = d3
      .area<any>()
      .x((d) => xScale(new Date(d[metadata.xAxis!])))
      .y0(height)
      .y1((d) => yScale(d[metadata.yAxis as string]));

    g.append("path").datum(data).attr("fill", "url(#gradient)").attr("d", area);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g").call(d3.axisLeft(yScale));
  };
  const drawSankeyDiagram = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const nodes = Array.from(new Set(data.map((d) => d[metadata.nodes!])));
    const links = data.map((d) => ({
      source: d[metadata.source as keyof typeof d] || null,
      target: d[metadata.target as keyof typeof d] || null,
      value: d[metadata.value as keyof typeof d] || null,
    }));

    const link = d3
      .linkHorizontal()
      .x((d) => d?.[0] ?? 0)
      .y((d) => d?.[1] ?? 0);

    const linkLine = g
      .selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("d", link);

    const node = g
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", (_, i) => color(i as unknown as string));

    const nodeText = g
      .selectAll(".node-text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .text((d) => d);

    return () => {
      linkLine.remove();
      node.remove();
      nodeText.remove();
    };
  };
  const drawGaugeChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const radius = Math.min(width, height) / 2;
    const gauge = d3.arc().innerRadius(0).outerRadius(radius);

    const arcs = g
      .selectAll(".arc")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "arc")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    arcs
      .append("path")
      .attr("d", gauge)
      .attr("fill", (_, i) => color(i as unknown as string));

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${gauge.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text((d) => d[metadata.metric!]);

    return () => {
      arcs.remove();
    };
  };

  const drawComboChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const xScale = d3
      .scaleTime()
      .domain(
        d3.extent(data, (d) => new Date(d[metadata.xAxis!])) as [Date, Date]
      )
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[metadata.yAxis as string])!])
      .range([height, 0]);

    const line = d3
      .line<any>()
      .x((d) => xScale(new Date(d[metadata.xAxis!])))
      .y((d) => yScale(d[metadata.yAxis as string]));

    const area = d3
      .area<any>()
      .x((d) => xScale(new Date(d[metadata.xAxis!])))
      .y0(height)
      .y1((d) => yScale(d[metadata.yAxis as string]));

    const bars = g
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(new Date(d[metadata.xAxis!])))
      .attr("y", (d) => yScale(d[metadata.yAxis as string]))
      .attr("width", width / data.length - 1)
      .attr("height", (d) => yScale(0) - yScale(d[metadata.yAxis as string]));

    const linePath = g
      .selectAll(".line")
      .data(data)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("d", line);

    const areaPath = g
      .selectAll(".area")
      .data(data)
      .enter()
      .append("path")
      .attr("fill", "url(#gradient)")
      .attr("d", area);

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    const yAxis = g.append("g").call(d3.axisLeft(yScale));

    return () => {
      bars.remove();
      linePath.remove();
      areaPath.remove();
      xAxis.remove();
      yAxis.remove();
    };
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};
