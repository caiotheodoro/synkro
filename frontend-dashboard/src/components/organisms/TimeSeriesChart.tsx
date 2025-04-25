import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { IPrediction } from "@/services/ai-prediction.service";

interface TimeSeriesChartProps {
  predictions: IPrediction[];
  selectedModel: string;
  isLoading: boolean;
}

const TimeSeriesChart = ({
  predictions,
  selectedModel,
  isLoading,
}: TimeSeriesChartProps) => {
  const prepareTimeSeriesData = () => {
    const sortedPredictions = [...predictions]
      .filter((p) => p?.model_name === selectedModel)
      .sort(
        (a, b) =>
          new Date(a?.timestamp || 0).getTime() -
          new Date(b?.timestamp || 0).getTime()
      );

    return sortedPredictions.map((p) => ({
      timestamp: p?.timestamp
        ? new Date(p.timestamp).toLocaleString()
        : "Unknown",
      predictedDemand: p?.predicted_demand || 0,
      confidenceScore: p?.confidence_score || 0,
      itemId:
        typeof p?.item_id === "string" ? p.item_id.slice(0, 8) : "Unknown",
    }));
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Prediction Time Series</CardTitle>
        <CardDescription>
          Predictions over time with confidence scores
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={prepareTimeSeriesData()}
              margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="predictedDemand"
                stroke="#8884d8"
                name="Predicted Demand"
                strokeWidth={3}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="confidenceScore"
                stroke="#FF8042"
                name="Confidence"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
