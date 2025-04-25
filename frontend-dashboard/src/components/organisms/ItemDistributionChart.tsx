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

interface ItemDistributionChartProps {
  predictions: IPrediction[];
  selectedModel: string;
  isLoading: boolean;
}

const ItemDistributionChart = ({
  predictions,
  selectedModel,
  isLoading,
}: ItemDistributionChartProps) => {
  const prepareItemDistributionData = () => {
    const itemMap = new Map<string, number>();

    predictions
      .filter((p) => p?.model_name === selectedModel)
      .forEach((p) => {
        if (!p?.item_id) return;
        const itemId =
          typeof p.item_id === "string" ? p.item_id.slice(0, 8) : "Unknown";
        itemMap.set(itemId, (itemMap.get(itemId) || 0) + 1);
      });

    return Array.from(itemMap.entries()).map(([itemId, count]) => ({
      itemId,
      count,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictions by Item</CardTitle>
        <CardDescription>
          Distribution of predictions across items
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareItemDistributionData()}
              margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="itemId"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#6bf178" name="Prediction Count" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ItemDistributionChart;
