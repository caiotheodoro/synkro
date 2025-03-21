import React, { useEffect, useRef, useState } from "react";
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
    source?: string;
    target?: string;
  };
}

interface D3ChartProps {
  data: ChartData;
  width?: number;
  height?: number;
  className?: string;
}

// Define Node type for Sankey diagrams
interface SankeyNode {
  name: any;
  layer?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

// Define Link type for Sankey diagrams
interface SankeyLink {
  source: number;
  target: number;
  value: number;
  width?: number;
  sourceX?: number;
  sourceY?: number;
  targetX?: number;
  targetY?: number;
}

export const D3Chart: React.FC<D3ChartProps> = ({
  data,
  width = 600,
  height = 400,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [renderStatus, setRenderStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRenderStatus("loading");
    setError(null);

    const timerId = setTimeout(() => {
      try {
        if (!svgRef.current) {
          setError("SVG reference is null");
          setRenderStatus("error");
          console.error("D3Chart: SVG reference is null");
          return;
        }

        if (!data) {
          setError("Data is null or undefined");
          setRenderStatus("error");
          console.error("D3Chart: Data is null or undefined");
          return;
        }

        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          setError("Data array is empty or invalid");
          setRenderStatus("error");
          console.error("D3Chart: Data array is empty or invalid", data);
          return;
        }

        if (!data.metadata || !data.metadata.type) {
          setError("Missing metadata or chart type");
          setRenderStatus("error");
          console.error(
            "D3Chart: Missing metadata or chart type",
            data.metadata
          );
          return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        console.log(
          `D3Chart: Rendering chart of type ${data.metadata.type} with metadata:`,
          data.metadata
        );

        switch (data.metadata.type) {
          case "line":
            drawLineChart(g, data, innerWidth, innerHeight, margin);
            break;
          case "pie":
            drawPieChart(g, data, Math.min(innerWidth, innerHeight));
            break;
          case "stacked-bar":
            drawStackedBarChart(g, data, innerWidth, innerHeight);
            break;
          case "area":
            drawAreaChart(g, data, innerWidth, innerHeight, margin);
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
          case "funnel":
            drawFunnelChart(g, data, innerWidth, innerHeight);
            break;
          case "bar":
            drawBarChart(g, data, innerWidth, innerHeight);
            break;
          default:
            setError(`Unsupported chart type: ${data.metadata.type}`);
            setRenderStatus("error");
            console.warn("Unsupported chart type:", data.metadata.type);
            return;
        }

        setRenderStatus("success");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        setRenderStatus("error");
        console.error("D3Chart: Error rendering chart", error);
      }
    }, 100);

    return () => clearTimeout(timerId);
  }, [data, width, height]);

  const drawLineChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ) => {
    const { data, metadata } = chartData;

    g.selectAll("*").remove();

    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data for line chart");
      }

      if (!metadata.xAxis || !metadata.yAxis) {
        throw new Error("Missing xAxis or yAxis metadata");
      }

      const series =
        metadata.metrics && Array.isArray(metadata.metrics)
          ? metadata.metrics
          : [metadata.yAxis as string];

      const isDate = data.some(
        (d) =>
          d[metadata.xAxis!] instanceof Date ||
          (typeof d[metadata.xAxis!] === "string" &&
            !isNaN(Date.parse(d[metadata.xAxis!])))
      );

      let x: d3.ScaleBand<string> | d3.ScaleTime<number, number>;

      if (isDate) {
        const dateData = data.map((d) => ({
          ...d,
          [metadata.xAxis!]:
            typeof d[metadata.xAxis!] === "string"
              ? new Date(d[metadata.xAxis!])
              : d[metadata.xAxis!],
        }));

        const xExtent = d3.extent(
          dateData,
          (d) => d[metadata.xAxis!] as Date
        ) as [Date, Date];
        x = d3
          .scaleTime()
          .domain(xExtent)
          .range([margin.left, width - margin.right]);
      } else {
        x = d3
          .scaleBand()
          .domain(data.map((d) => String(d[metadata.xAxis!])))
          .range([margin.left, width - margin.right])
          .padding(0.1);
      }

      let allValues: number[] = [];
      series.forEach((metric) => {
        const values = data.map((d) => +d[metric] || 0);
        allValues = [...allValues, ...values];
      });

      const yMin = Math.min(0, d3.min(allValues) ?? 0);
      const yMax = d3.max(allValues) ?? 0;

      const y = d3
        .scaleLinear()
        .domain([yMin, yMax * 1.1])
        .range([height - margin.bottom, margin.top]);

      const colorScale = d3.scaleOrdinal([
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
      ]);

      const xAxis = g
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          isDate
            ? d3.axisBottom(x as d3.ScaleTime<number, number>)
            : d3.axisBottom(x as d3.ScaleBand<string>)
        );

      xAxis
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      xAxis.selectAll("line").attr("stroke", "#ccc");

      xAxis.selectAll("path").attr("stroke", "#ccc");

      const yAxis = g
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      yAxis.selectAll("text").attr("font-size", "10px").attr("fill", "#333");

      yAxis.selectAll("line").attr("stroke", "#ccc");

      yAxis.selectAll("path").attr("stroke", "#ccc");

      const line = d3
        .line<any>()
        .x((d) => {
          return isDate
            ? (x as d3.ScaleTime<number, number>)(new Date(d[metadata.xAxis!]))
            : (x as d3.ScaleBand<string>)(String(d[metadata.xAxis!]))! +
                (x as d3.ScaleBand<string>).bandwidth() / 2;
        })
        .y((d) => y(d.value))
        .curve(d3.curveMonotoneX);

      series.forEach((metric, i) => {
        const seriesData = data.map((d) => ({
          ...d,
          value: +d[metric] || 0,
        }));

        g.append("path")
          .datum(seriesData)
          .attr("fill", "none")
          .attr("stroke", colorScale(metric))
          .attr("stroke-width", 3)
          .attr("d", line);

        g.selectAll(`.dot-${i}`)
          .data(seriesData)
          .enter()
          .append("circle")
          .attr("class", `dot-${i}`)
          .attr("cx", (d) => {
            return isDate
              ? (x as d3.ScaleTime<number, number>)(
                  new Date(d[metadata.xAxis!])
                )
              : (x as d3.ScaleBand<string>)(String(d[metadata.xAxis!]))! +
                  (x as d3.ScaleBand<string>).bandwidth() / 2;
          })
          .attr("cy", (d) => y(d.value))
          .attr("r", 5)
          .attr("fill", colorScale(metric))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      });

      g.append("g")
        .attr("class", "grid")
        .attr("opacity", 0.1)
        .selectAll("line")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", (d) => y(d))
        .attr("y2", (d) => y(d))
        .attr("stroke", "#000");
    } catch (error: any) {
      console.error("Error generating line chart:", error);
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .text(`Error: ${error.message || "Unknown error"}`);
    }
  };

  const drawPieChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    radius: number
  ) => {
    const { data, metadata } = chartData;

    g.selectAll("*").remove();

    try {
      console.log(
        "Drawing pie chart with data:",
        JSON.stringify(data, null, 2)
      );
      console.log("Pie chart metadata:", metadata);

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data for pie chart");
      }

      if (!metadata.dimension || !metadata.metric) {
        throw new Error(
          `Missing dimension or metric metadata. Dimension: ${metadata.dimension}, Metric: ${metadata.metric}`
        );
      }

      const missingDimension = data.some(
        (d) => typeof d[metadata.dimension!] === "undefined"
      );
      const missingMetric = data.some(
        (d) => typeof d[metadata.metric!] === "undefined"
      );

      if (missingDimension || missingMetric) {
        console.error("Data is missing required fields:", {
          dimension: metadata.dimension,
          metric: metadata.metric,
          firstDataPoint: data[0],
        });
        throw new Error(
          `Data is missing required fields. Dimension: ${metadata.dimension}, Metric: ${metadata.metric}`
        );
      }

      const pieData = data.map((d) => ({
        label: String(d[metadata.dimension!]),
        value: +d[metadata.metric!] || 0,
      }));

      console.log("Processed pie data:", pieData);

      const pie = d3
        .pie<any>()
        .value((d) => d.value)
        .sort(null);

      const arcs = pie(pieData);

      const chart = g
        .append("g")
        .attr("transform", `translate(${radius / 2}, ${radius / 2})`);

      const arcGen = d3
        .arc<any>()
        .innerRadius(radius * 0.2)
        .outerRadius(radius * 0.4);

      const colors = [
        "#FF6384", // pink
        "#36A2EB", // blue
        "#FFCE56", // yellow
        "#4BC0C0", // teal
        "#9966FF", // purple
        "#FF9F40", // orange
        "#7BC043", // green
        "#C9224C", // raspberry
      ];

      chart
        .selectAll("path")
        .data(arcs)
        .enter()
        .append("path")
        .attr("d", arcGen)
        .attr("fill", (d, i) => colors[i % colors.length])
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("opacity", 0.9);

      const labelArc = d3
        .arc<any>()
        .innerRadius(radius * 0.3)
        .outerRadius(radius * 0.3);

      chart
        .selectAll("text.value")
        .data(arcs)
        .enter()
        .append("text")
        .attr("class", "value")
        .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text((d) => d.value);

      // Add legend
      const legend = g
        .append("g")
        .attr("transform", `translate(${radius * 0.8}, 10)`);

      pieData.forEach((d, i) => {
        const legendRow = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        legendRow
          .append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("x", 40)
          .attr("fill", colors[i % colors.length]);

        legendRow
          .append("text")
          .attr("x", 60)
          .attr("y", 10)
          .attr("text-anchor", "start")
          .attr("font-size", "12px")
          .text(`${d.label}: ${d.value}`);
      });
    } catch (error: any) {
      console.error("Error generating pie chart:", error);
      g.append("text")
        .attr("x", radius / 2)
        .attr("y", radius / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .text(`Error: ${error.message || "Unknown error"}`);
    }
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
        return x(xValue) || 0;
      })
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append("g").call(d3.axisLeft(y));
  };

  const drawBarChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;

    // Clear any existing content
    g.selectAll("*").remove();

    try {
      // Safety checks
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data for bar chart");
      }

      if (!metadata.xAxis || !metadata.yAxis) {
        throw new Error("Missing xAxis or yAxis metadata");
      }

      console.log("Drawing bar chart with data:", data);
      console.log("First data point example:", data[0]);
      console.log("X-axis field:", metadata.xAxis);
      console.log("Y-axis field:", metadata.yAxis);

      // Define margin
      const margin = { top: 30, right: 30, bottom: 70, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Define scales
      const x = d3
        .scaleBand()
        .domain(data.map((d) => String(d[metadata.xAxis!])))
        .range([0, innerWidth])
        .padding(0.2);

      // Find the max y value
      const yAxisField =
        typeof metadata.yAxis === "string" ? metadata.yAxis : "count";
      const yMax = d3.max(data, (d) => +d[yAxisField]) || 0;

      const y = d3
        .scaleLinear()
        .domain([0, yMax * 1.1]) // Add 10% padding at the top
        .range([innerHeight, 0]);

      // Create a group element for the chart
      const chart = g
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Define color scheme
      const colors = [
        "#FF6384", // pink
        "#36A2EB", // blue
        "#FFCE56", // yellow
        "#4BC0C0", // teal
        "#9966FF", // purple
        "#FF9F40", // orange
      ];

      // Add X axis
      chart
        .append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("fill", "#333");

      // Add Y axis
      chart
        .append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("fill", "#333");

      // Add X axis title
      chart
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + margin.bottom - 10)
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(metadata.xAxis);

      // Add Y axis title
      chart
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 15)
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(yAxisField);

      // Add grid lines
      chart
        .append("g")
        .attr("class", "grid")
        .attr("opacity", 0.1)
        .selectAll("line")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", (d) => y(d))
        .attr("y2", (d) => y(d))
        .attr("stroke", "#000");

      // Add the bars with gradient fill
      chart
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(String(d[metadata.xAxis!]))!)
        .attr("width", x.bandwidth())
        .attr("y", (d) => y(+d[yAxisField]))
        .attr("height", (d) => innerHeight - y(+d[yAxisField]))
        .attr("fill", (_, i) => colors[i % colors.length])
        .attr("rx", 4)
        .attr("ry", 4);

      // Add value labels on top of bars
      chart
        .selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("x", (d) => x(String(d[metadata.xAxis!]))! + x.bandwidth() / 2)
        .attr("y", (d) => y(+d[yAxisField]) - 5)
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .attr("font-weight", "bold")
        .text((d) => +d[yAxisField]);

      // Add title
      chart
        .append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text("Order Pipeline");
    } catch (error: any) {
      console.error("Error generating bar chart:", error);
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .text(`Error: ${error.message || "Unknown error"}`);
    }
  };

  const drawAreaChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ) => {
    const { data, metadata } = chartData;

    // Clear any existing content
    g.selectAll("*").remove();

    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data for area chart");
      }

      if (!metadata.xAxis || !metadata.yAxis) {
        throw new Error("Missing xAxis or yAxis metadata");
      }

      console.log("Drawing area chart with data:", data);
      console.log("First data point example:", data[0]);
      console.log("X-axis field:", metadata.xAxis);
      console.log("Y-axis field:", metadata.yAxis);

      // Check if x values are dates or strings
      const isDate = data.some(
        (d) =>
          d[metadata.xAxis!] instanceof Date ||
          (typeof d[metadata.xAxis!] === "string" &&
            !isNaN(Date.parse(d[metadata.xAxis!])))
      );

      const isString = data.some((d) => typeof d[metadata.xAxis!] === "string");

      console.log("X-axis values are dates:", isDate);
      console.log("X-axis values are strings:", isString);

      let x: d3.ScaleBand<string> | d3.ScaleTime<number, number>;

      if (isDate) {
        // Parse dates if they're strings
        const dateData = data.map((d) => ({
          ...d,
          [metadata.xAxis!]:
            typeof d[metadata.xAxis!] === "string"
              ? new Date(d[metadata.xAxis!])
              : d[metadata.xAxis!],
        }));

        const xExtent = d3.extent(
          dateData,
          (d) => d[metadata.xAxis!] as Date
        ) as [Date, Date];
        x = d3
          .scaleTime()
          .domain(xExtent)
          .range([margin.left, width - margin.right]);
      } else {
        // Use band scale for strings
        x = d3
          .scaleBand()
          .domain(data.map((d) => String(d[metadata.xAxis!])))
          .range([margin.left, width - margin.right])
          .padding(0.1);
      }

      const yValues = data.map((d) => +d[metadata.yAxis as string] || 0);
      const yMin = Math.min(0, d3.min(yValues) || 0);
      const yMax = d3.max(yValues) || 0;

      const y = d3
        .scaleLinear()
        .domain([yMin, yMax * 1.1]) // Add 10% padding at the top
        .range([height - margin.bottom, margin.top]);

      // Add X and Y axes
      const xAxis = g
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          isDate
            ? d3.axisBottom(x as d3.ScaleTime<number, number>)
            : d3.axisBottom(x as d3.ScaleBand<string>)
        );

      // Style x-axis
      xAxis
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      xAxis.selectAll("line").attr("stroke", "#ccc");

      xAxis.selectAll("path").attr("stroke", "#ccc");

      const yAxis = g
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      // Style y-axis
      yAxis.selectAll("text").attr("font-size", "10px").attr("fill", "#333");

      yAxis.selectAll("line").attr("stroke", "#ccc");

      yAxis.selectAll("path").attr("stroke", "#ccc");

      // Create area generator
      const area = d3
        .area<any>()
        .x((d) => {
          return isDate
            ? (x as d3.ScaleTime<number, number>)(new Date(d[metadata.xAxis!]))
            : (x as d3.ScaleBand<string>)(String(d[metadata.xAxis!]))! +
                (x as d3.ScaleBand<string>).bandwidth() / 2;
        })
        .y0(y(0))
        .y1((d) => y(+d[metadata.yAxis as string] || 0))
        .curve(d3.curveMonotoneX);

      // Add the area
      g.append("path")
        .datum(data)
        .attr("fill", "url(#gradient)")
        .attr("d", area);

      // Add the line on top of the area
      const line = d3
        .line<any>()
        .x((d) => {
          return isDate
            ? (x as d3.ScaleTime<number, number>)(new Date(d[metadata.xAxis!]))
            : (x as d3.ScaleBand<string>)(String(d[metadata.xAxis!]))! +
                (x as d3.ScaleBand<string>).bandwidth() / 2;
        })
        .y((d) => y(+d[metadata.yAxis as string] || 0))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#6366F1")
        .attr("stroke-width", 3)
        .attr("d", line);

      // Add dots for data points
      g.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => {
          return isDate
            ? (x as d3.ScaleTime<number, number>)(new Date(d[metadata.xAxis!]))
            : (x as d3.ScaleBand<string>)(String(d[metadata.xAxis!]))! +
                (x as d3.ScaleBand<string>).bandwidth() / 2;
        })
        .attr("cy", (d) => y(+d[metadata.yAxis as string] || 0))
        .attr("r", 5)
        .attr("fill", "#6366F1")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // Add grid lines
      g.append("g")
        .attr("class", "grid")
        .attr("opacity", 0.1)
        .selectAll("line")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", (d) => y(d))
        .attr("y2", (d) => y(d))
        .attr("stroke", "#000");
    } catch (error: any) {
      console.error("Error generating area chart:", error);
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .text(`Error: ${error.message || "Unknown error"}`);
    }
  };

  const drawSankeyDiagram = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    try {
      // Define margins
      const margin = { top: 10, right: 10, bottom: 10, left: 10 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Check if we have actual sankey data with source/target properties
      if (!chartData.metadata.source || !chartData.metadata.target) {
        // This is likely a status count chart mislabeled as sankey
        console.warn(
          "Sankey diagram missing source or target properties, treating as pie chart"
        );
        drawPieChart(
          g,
          {
            data: chartData.data,
            metadata: {
              type: "pie",
              dimension: chartData.metadata.nodes || "status",
              metric: chartData.metadata.value || "count",
            },
          },
          Math.min(innerWidth, innerHeight) / 2
        );
        return;
      }

      // Get the source, target and value properties from metadata
      const sourceField = chartData.metadata.source;
      const targetField = chartData.metadata.target;
      const valueField = chartData.metadata.value || "value";

      const { data } = chartData;

      // Clear any existing content
      g.selectAll("*").remove();

      // Validate data
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data for Sankey diagram");
      }

      // Prepare nodes and links
      const nodeMap = new Map<any, number>();
      let nodeIndex = 0;

      // Extract unique node names
      data.forEach((d) => {
        const source = d[sourceField];
        const target = d[targetField];

        if (!nodeMap.has(source)) {
          nodeMap.set(source, nodeIndex++);
        }

        if (!nodeMap.has(target)) {
          nodeMap.set(target, nodeIndex++);
        }
      });

      // Create nodes array from the map
      const nodes: SankeyNode[] = Array.from(nodeMap).map(([name]) => ({
        name,
      }));

      // Create links array
      const links: SankeyLink[] = data.map((d) => ({
        source: nodeMap.get(d[sourceField]) as number,
        target: nodeMap.get(d[targetField]) as number,
        value: +d[valueField] || 1,
      }));

      // Define node width and padding
      const nodeWidth = 40;
      const nodePadding = 10;

      // Create a simple layout
      let layerCount = 0;
      const layerSizes: number[] = [];
      const nodeLayer = new Map<number, number>();

      // Assign layers - first find starting nodes (only source)
      const targetNodes = new Set(links.map((d) => d.target));
      let currentLayer = 0;
      let nodesInCurrentLayer = 0;

      // First layer - nodes that are only sources
      nodes.forEach((_, i) => {
        if (!targetNodes.has(i)) {
          nodeLayer.set(i, currentLayer);
          nodesInCurrentLayer++;
        }
      });

      if (nodesInCurrentLayer > 0) {
        layerSizes.push(nodesInCurrentLayer);
        layerCount++;
      }

      // Process remaining nodes by following links
      let processed = new Set(nodeLayer.keys());
      let remainingNodes = nodes.length - processed.size;

      while (remainingNodes > 0) {
        currentLayer++;
        nodesInCurrentLayer = 0;

        // Find nodes that are targets of nodes in the previous layer
        const nextLayerNodes = new Set<number>();

        processed.forEach((sourceNodeIndex) => {
          links.forEach((link) => {
            if (
              link.source === sourceNodeIndex &&
              !processed.has(link.target)
            ) {
              nextLayerNodes.add(link.target);
            }
          });
        });

        // Assign this layer
        nextLayerNodes.forEach((nodeIndex) => {
          nodeLayer.set(nodeIndex, currentLayer);
          processed.add(nodeIndex);
          nodesInCurrentLayer++;
        });

        if (nodesInCurrentLayer > 0) {
          layerSizes.push(nodesInCurrentLayer);
          layerCount++;
        } else {
          // If we can't assign any more nodes through links,
          // put remaining unassigned nodes in the next layer
          const unassigned = [];
          for (let i = 0; i < nodes.length; i++) {
            if (!processed.has(i)) {
              unassigned.push(i);
            }
          }

          if (unassigned.length > 0) {
            unassigned.forEach((nodeIndex) => {
              nodeLayer.set(nodeIndex, currentLayer);
              processed.add(nodeIndex);
              nodesInCurrentLayer++;
            });

            layerSizes.push(nodesInCurrentLayer);
            layerCount++;
          }
        }

        remainingNodes = nodes.length - processed.size;
      }

      // Calculate node positions
      const totalWidth = innerWidth;
      const layerWidth = totalWidth / Math.max(1, layerCount);

      // Position nodes
      nodes.forEach((node, i) => {
        const layer = nodeLayer.get(i) || 0;

        // Calculate vertical positions within layer
        const nodesInThisLayer = layerSizes[layer];
        const layerHeight = innerHeight / nodesInThisLayer;

        // Find position within layer
        let posInLayer = 0;
        for (let j = 0; j < i; j++) {
          if ((nodeLayer.get(j) || 0) === layer) {
            posInLayer++;
          }
        }

        // Set node positions
        node.x0 = layer * layerWidth;
        node.x1 = node.x0 + nodeWidth;
        node.y0 = posInLayer * layerHeight;
        node.y1 = node.y0 + layerHeight - nodePadding;
      });

      // Draw the links
      g.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", (d) => {
          const source = nodes[d.source];
          const target = nodes[d.target];

          if (
            !source ||
            !target ||
            source.x0 === undefined ||
            source.y0 === undefined ||
            source.x1 === undefined ||
            source.y1 === undefined ||
            target.x0 === undefined ||
            target.y0 === undefined ||
            target.x1 === undefined ||
            target.y1 === undefined
          ) {
            return "";
          }

          const sourceX = source.x1;
          const sourceY = (source.y0 + source.y1) / 2;
          const targetX = target.x0;
          const targetY = (target.y0 + target.y1) / 2;

          // Calculate link width based on value
          const maxValue = Math.max(...links.map((l) => l.value));
          const minWidth = 2;
          const maxWidth = 20;
          const linkWidth =
            minWidth + (d.value / maxValue) * (maxWidth - minWidth);

          // Assign width for later use
          d.width = linkWidth;

          // Create a curved path
          return `M${sourceX},${sourceY}
                  C${sourceX + (targetX - sourceX) * 0.5},${sourceY}
                    ${targetX - (targetX - sourceX) * 0.5},${targetY}
                    ${targetX},${targetY}`;
        })
        .attr("fill", "none")
        .attr("stroke", (d) => {
          const colors = [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ];

          const sourceColor = d3.rgb(colors[d.source % colors.length]);
          const targetColor = d3.rgb(colors[d.target % colors.length]);

          // Create gradient ID
          const gradientId = `link-gradient-${d.source}-${d.target}`;

          // Create linear gradient
          const gradient = g
            .append("linearGradient")
            .attr("id", gradientId)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", nodes[d.source].x1 || 0)
            .attr("x2", nodes[d.target].x0 || 0)
            .attr(
              "y1",
              ((nodes[d.source].y0 || 0) + (nodes[d.source].y1 || 0)) / 2
            )
            .attr(
              "y2",
              ((nodes[d.target].y0 || 0) + (nodes[d.target].y1 || 0)) / 2
            );

          gradient
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", sourceColor.toString());

          gradient
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", targetColor.toString());

          return `url(#${gradientId})`;
        })
        .attr("stroke-width", (d) => d.width || 2)
        .attr("opacity", 0.7);

      // Draw the nodes
      const nodeGroups = g
        .selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

      // Add top labels for nodes instead of inside labels
      nodeGroups
        .append("text")
        .attr("x", 0)
        .attr("y", -8) // Position above the node
        .attr("text-anchor", "start")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#333") // Dark color for labels
        .text((d) => d.name);

      // Add rectangles for nodes (remove the text inside)
      nodeGroups
        .append("rect")
        .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
        .attr("height", (d) => (d.y1 || 0) - (d.y0 || 0))
        .attr("fill", (_, i) => {
          const colors = [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ];
          return colors[i % colors.length];
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.8)
        .attr("rx", 4)
        .attr("ry", 4);

      // Add value labels on links
      g.selectAll(".link-label")
        .data(links)
        .enter()
        .append("text")
        .attr("class", "link-label")
        .attr("x", (d) => {
          const source = nodes[d.source];
          const target = nodes[d.target];
          return ((source.x1 || 0) + (target.x0 || 0)) / 2;
        })
        .attr("y", (d) => {
          const source = nodes[d.source];
          const target = nodes[d.target];
          return (
            (((source.y0 || 0) + (source.y1 || 0)) / 2 +
              ((target.y0 || 0) + (target.y1 || 0)) / 2) /
            2
          );
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .attr("paint-order", "stroke")
        .text((d) => d.value);
    } catch (error: any) {
      console.error("Error generating Sankey diagram:", error);
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .text(`Error: ${error.message || "Unknown error"}`);
    }
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

  const drawFunnelChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartData: ChartData,
    width: number,
    height: number
  ) => {
    const { data, metadata } = chartData;

    // Clear any existing content
    g.selectAll("*").remove();

    try {
      // Safety checks
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data for funnel chart");
      }

      if (!metadata.dimension) {
        throw new Error("Missing dimension metadata");
      }

      // Check if we're using the metrics array for multiple metrics
      const useMultipleMetrics =
        metadata.metrics &&
        Array.isArray(metadata.metrics) &&
        metadata.metrics.length > 0;

      // Primary metric for sorting is the first one in the array or the single metric
      const primaryMetric =
        useMultipleMetrics && metadata.metrics
          ? metadata.metrics[0]
          : metadata.metric || "count";

      // Handle mapping from camelCase to snake_case for avgProcessingTime -> avg_processing_time
      const getMetricValue = (item: any, metricName: string) => {
        // Map camelCase to snake_case if needed
        if (
          metricName === "avgProcessingTime" &&
          "avg_processing_time" in item
        ) {
          return +item["avg_processing_time"];
        }
        return +item[metricName] || 0;
      };

      // Format time in a readable way (converts milliseconds to days, hours, etc.)
      const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
        if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`;
        return `${(ms / 86400000).toFixed(1)}d`;
      };

      // Sort data by the primary metric (usually count) in descending order
      const sortedData = [...data].sort(
        (a, b) =>
          getMetricValue(b, primaryMetric) - getMetricValue(a, primaryMetric)
      );

      // Define the color scale - use vibrant colors
      const colors = [
        "#FF6384", // bright pink
        "#36A2EB", // bright blue
        "#FFCE56", // bright yellow
        "#4BC0C0", // teal
        "#9966FF", // purple
        "#FF9F40", // orange
      ];

      // Calculate the max value for scaling
      const maxValue =
        d3.max(sortedData, (d) => getMetricValue(d, primaryMetric)) || 0;

      // Define funnel dimensions - make smaller
      const maxWidth = width * 0.6; // Reduced from 0.8 to 0.6 (25% smaller)
      const barHeight = (height * 0.8) / (sortedData.length + 1); // Reduced height by 20%
      const centerX = width / 2;

      // Calculate total height needed for the funnel
      const totalFunnelHeight = barHeight * sortedData.length;
      // Calculate starting Y position to center the funnel vertically
      const startY = (height - totalFunnelHeight) / 2;

      // Draw each funnel segment
      sortedData.forEach((d, i) => {
        const value = getMetricValue(d, primaryMetric);
        const percentage = value / maxValue;
        const barWidth = maxWidth * percentage;
        const y = startY + i * barHeight; // Use startY for vertical centering

        // Draw the funnel segment
        g.append("rect")
          .attr("x", centerX - barWidth / 2)
          .attr("y", y)
          .attr("width", barWidth)
          .attr("height", barHeight * 0.8)
          .attr("fill", colors[i % colors.length])
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("rx", 4)
          .attr("ry", 4);

        // Add the label (dimension)
        g.append("text")
          .attr("x", centerX - barWidth / 2 - 10)
          .attr("y", y + barHeight * 0.4)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#333")
          .text(
            String(d[metadata.dimension!]).charAt(0).toUpperCase() +
              String(d[metadata.dimension!]).slice(1)
          );

        // Add the primary value (usually count)
        g.append("text")
          .attr("x", centerX + barWidth / 2 + 10)
          .attr("y", y + barHeight * 0.4 - 8) // Position above for first metric
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "12px")
          .attr("fill", "#666")
          .text(`${primaryMetric}: ${value}`);

        // Add the secondary metric if available (usually avg_processing_time)
        if (
          useMultipleMetrics &&
          metadata.metrics &&
          metadata.metrics.length > 1
        ) {
          const secondaryMetric = metadata.metrics[1];
          const secondaryValue = getMetricValue(d, secondaryMetric);

          // Only display if the value is present and valid
          if (secondaryValue) {
            g.append("text")
              .attr("x", centerX + barWidth / 2 + 10)
              .attr("y", y + barHeight * 0.4 + 8) // Position below for second metric
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "middle")
              .attr("font-size", "11px")
              .attr("fill", "#666")
              .text(`Avg. Time: ${formatTime(secondaryValue)}`);
          }
        }

        // Add percentage inside the bar
        g.append("text")
          .attr("x", centerX)
          .attr("y", y + barHeight * 0.4)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#fff")
          .text(`${Math.round(percentage * 100)}%`);

        // Add connecting lines between segments
        if (i < sortedData.length - 1) {
          const nextValue = getMetricValue(sortedData[i + 1], primaryMetric);
          const nextPercentage = nextValue / maxValue;
          const nextBarWidth = maxWidth * nextPercentage;
          const nextY = (i + 1) * barHeight + barHeight / 2;

          // Left side connector
          g.append("line")
            .attr("x1", centerX - barWidth / 2)
            .attr("y1", y + barHeight * 0.4)
            .attr("x2", centerX - nextBarWidth / 2)
            .attr("y2", nextY + barHeight * 0.4)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

          // Right side connector
          g.append("line")
            .attr("x1", centerX + barWidth / 2)
            .attr("y1", y + barHeight * 0.4)
            .attr("x2", centerX + nextBarWidth / 2)
            .attr("y2", nextY + barHeight * 0.4)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
        }
      });

      // Add a title for the chart
      g.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#333");
    } catch (error: any) {
      console.error("Error generating funnel chart:", error);
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .text(`Error: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {renderStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium">Loading...</p>
          </div>
        </div>
      )}

      {renderStatus === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
          <div className="text-center p-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-red-500 font-medium">Chart Error</p>
            {error && <p className="text-xs text-gray-500">{error}</p>}
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full bg-white border border-gray-200"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
          </linearGradient>

          {/* Add more color gradients for different chart types */}
          <linearGradient id="pie-gradient-0" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6384" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff6384" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="pie-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#36a2eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#36a2eb" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="pie-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffce56" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffce56" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="pie-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4bc0c0" stopOpacity="1" />
            <stop offset="100%" stopColor="#4bc0c0" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Add a background rect to ensure SVG is visible */}
        <rect x="0" y="0" width={width} height={height} fill="white" />
      </svg>
    </div>
  );
};
