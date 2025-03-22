import {
  format,
  parseISO,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  [key: string]: any;
}

export type AggregationPeriod = "hour" | "day" | "week" | "month";

export interface AggregatedDataPoint {
  period: string;
  value: number;
  count: number;
  [key: string]: any;
}

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

export class TimeSeriesHelper {
  /**
   * Aggregates time series data by a specified period
   */
  static aggregateTimeSeries(
    data: any[],
    timestampField: string,
    valueField: string,
    period: AggregationPeriod = "day",
    formatLabels = true
  ): AggregatedDataPoint[] {
    if (!data || !data.length) return [];

    // Helper to safely get field value with snake_case/camelCase fallbacks
    const getFieldValue = (item: any, field: string): any => {
      // Direct match
      if (item[field] !== undefined) {
        return item[field];
      }

      // Try camelCase if we have snake_case
      if (field.includes("_")) {
        const camelCase = field.replace(/_([a-z])/g, (_, p1) =>
          p1.toUpperCase()
        );
        if (item[camelCase] !== undefined) {
          return item[camelCase];
        }
      }

      // Try snake_case if we have camelCase
      if (/[A-Z]/.test(field)) {
        const snakeCase = field.replace(/([A-Z])/g, "_$1").toLowerCase();
        if (item[snakeCase] !== undefined) {
          return item[snakeCase];
        }
      }

      return null;
    };

    // Map to standardize data points
    const timeseriesData = data.map((item) => {
      const rawTimestamp = getFieldValue(item, timestampField);
      const timestamp =
        typeof rawTimestamp === "string"
          ? parseISO(rawTimestamp)
          : new Date(rawTimestamp);

      const rawValue = getFieldValue(item, valueField);
      const value =
        typeof rawValue === "number" ? rawValue : parseFloat(rawValue) || 0;

      return {
        timestamp,
        value,
        original: item,
      };
    });

    // Group data by period
    const groupedData = new Map<
      number,
      { sum: number; count: number; period: Date; items: any[] }
    >();

    timeseriesData.forEach((item) => {
      let periodStart: Date;

      switch (period) {
        case "hour":
          periodStart = startOfHour(item.timestamp);
          break;
        case "day":
          periodStart = startOfDay(item.timestamp);
          break;
        case "week":
          periodStart = startOfWeek(item.timestamp);
          break;
        case "month":
          periodStart = startOfMonth(item.timestamp);
          break;
        default:
          periodStart = startOfDay(item.timestamp);
      }

      const key = periodStart.getTime();

      if (!groupedData.has(key)) {
        groupedData.set(key, {
          sum: 0,
          count: 0,
          period: periodStart,
          items: [],
        });
      }

      const group = groupedData.get(key)!;
      group.sum += item.value;
      group.count += 1;
      group.items.push(item.original);
    });

    // Sort by timestamp and format
    const result = Array.from(groupedData.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, group]) => {
        let periodLabel: string;

        if (formatLabels) {
          switch (period) {
            case "hour":
              periodLabel = format(group.period, "MMM dd HH:mm");
              break;
            case "day":
              periodLabel = format(group.period, "MMM dd yyyy");
              break;
            case "week":
              periodLabel = `Week of ${format(group.period, "MMM dd yyyy")}`;
              break;
            case "month":
              periodLabel = format(group.period, "MMM yyyy");
              break;
            default:
              periodLabel = format(group.period, "MMM dd yyyy");
          }
        } else {
          periodLabel = group.period.toISOString();
        }

        return {
          period: periodLabel,
          value: group.sum,
          count: group.count,
          average: group.sum / group.count,
          timestamp: group.period,
          items: group.items,
        };
      });

    return result;
  }

  /**
   * Transforms raw API response to a chart-friendly format
   */
  static transformTransactionVolumeData(data: any[], metadata: any): ChartData {
    if (!data || !data.length) {
      return { data: [], metadata: { ...metadata } };
    }

    // First, sort the input data by timestamp if available
    const sortedInputData = [...data];
    if (sortedInputData.length > 0 && sortedInputData[0].hour) {
      sortedInputData.sort((a, b) => {
        const timeA = new Date(a.hour).getTime();
        const timeB = new Date(b.hour).getTime();
        return timeA - timeB;
      });
    }

    // Identify the timestamp and value fields
    const timestampField = metadata.xAxis || metadata.x_axis || "hour";

    // Check for both camelCase and snake_case versions of the metric field
    const metadataValueField =
      metadata.yAxis || metadata.y_axis || "transaction_count";

    // For the actual data field, we need to check for multiple possible field names
    let valueField = metadataValueField;

    // Check the first data item to detect which field actually contains the count
    if (sortedInputData.length > 0) {
      const firstItem = sortedInputData[0];

      // Try snake_case version first
      if (firstItem.transaction_count !== undefined) {
        valueField = "transaction_count";
      }
      // Then try camelCase
      else if (firstItem.transactionCount !== undefined) {
        valueField = "transactionCount";
      }
      // Then try generic 'count' or 'value'
      else if (firstItem.count !== undefined) {
        valueField = "count";
      } else if (firstItem.value !== undefined) {
        valueField = "value";
      }
    }

    // Determine appropriate aggregation based on data density and date range
    let aggregationPeriod: AggregationPeriod = "day";

    // Check date range span
    if (sortedInputData.length > 1) {
      const firstDate = new Date(sortedInputData[0][timestampField]);
      const lastDate = new Date(
        sortedInputData[sortedInputData.length - 1][timestampField]
      );
      const diffInDays = Math.floor(
        (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Adjust aggregation period based on date range
      if (diffInDays > 60) {
        aggregationPeriod = "month";
      } else if (diffInDays > 14) {
        aggregationPeriod = "week";
      } else if (diffInDays <= 2) {
        aggregationPeriod = "hour";
      }
    }

    // If we have many data points, adjust aggregation level
    if (sortedInputData.length > 100) {
      aggregationPeriod = "month";
    } else if (sortedInputData.length > 50) {
      aggregationPeriod = "week";
    }

    // Aggregate the data
    const aggregatedData = this.aggregateTimeSeries(
      sortedInputData,
      timestampField,
      valueField,
      aggregationPeriod
    );

    // Transform for chart display
    return {
      data: aggregatedData.map((item) => ({
        period: item.period,
        count: item.value,
        // Keep original timestamp for tooltip or advanced features
        timestamp: item.timestamp.toISOString(),
      })),
      metadata: {
        type: "line",
        xAxis: "period",
        yAxis: "count",
      },
    };
  }
}
