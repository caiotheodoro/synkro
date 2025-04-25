import {
  BarChart,
  Bar,
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

interface ConfidenceScoreChartProps {
  predictions: IPrediction[];
  selectedModel: string;
  isLoading: boolean;
}

const ConfidenceScoreChart = ({
  predictions,
  selectedModel,
  isLoading,
}: ConfidenceScoreChartProps) => {
  const prepareConfidenceData = () => {
    return predictions
      .filter((p) => p?.model_name === selectedModel)
      .map((p) => ({
        itemId:
          typeof p?.item_id === "string" ? p.item_id.slice(0, 8) : "Unknown",
        confidenceScore: p?.confidence_score || 0,
      }));
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Confidence Scores</CardTitle>
        <CardDescription>Confidence scores for each prediction</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareConfidenceData()}
              margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="itemId"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="confidenceScore"
                fill="#ff5470"
                name="Confidence Score"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfidenceScoreChart;
