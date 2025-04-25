import {
  PieChart,
  Pie,
  Cell,
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

const COLORS = ["#FF8042", "#00C49F", "#FFBB28", "#0088FE", "#8884d8"];

interface PredictionDistributionChartProps {
  predictions: IPrediction[];
  selectedModel: string;
  isLoading: boolean;
}

const PredictionDistributionChart = ({
  predictions,
  selectedModel,
  isLoading,
}: PredictionDistributionChartProps) => {
  const preparePredictionDistributionData = () => {
    const predictionRanges = [
      { name: "0.0-0.2", range: [0, 0.2], count: 0 },
      { name: "0.2-0.4", range: [0.2, 0.4], count: 0 },
      { name: "0.4-0.6", range: [0.4, 0.6], count: 0 },
      { name: "0.6-0.8", range: [0.6, 0.8], count: 0 },
      { name: "0.8-1.0", range: [0.8, Infinity], count: 0 },
    ];

    predictions
      .filter((p) => p?.model_name === selectedModel)
      .forEach((p) => {
        if (p?.predicted_demand === undefined) return;
        const value = p.predicted_demand;
        for (const range of predictionRanges) {
          if (value >= range.range[0] && value < range.range[1]) {
            range.count++;
            break;
          }
        }
      });

    return predictionRanges;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prediction Value Distribution</CardTitle>
        <CardDescription>
          Distribution of prediction values by range
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={preparePredictionDistributionData()}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {preparePredictionDistributionData().map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} predictions`, "Count"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictionDistributionChart;
