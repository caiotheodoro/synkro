import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import ChartCard from "../molecules/ChartCard";
import { IPrediction } from "@/services/ai-prediction.service";

const COLORS = ["#FF8042", "#00C49F", "#FFBB28", "#0088FE", "#8884d8"];

interface ModelDistributionChartProps {
  predictions: IPrediction[];
  isLoading: boolean;
}

const ModelDistributionChart = ({
  predictions,
  isLoading,
}: ModelDistributionChartProps) => {
  const prepareModelDistributionData = () => {
    const modelMap = new Map<string, number>();

    predictions.forEach((p) => {
      if (!p?.model_name) return;
      modelMap.set(p.model_name, (modelMap.get(p.model_name) || 0) + 1);
    });

    return Array.from(modelMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  };

  return (
    <ChartCard
      title="Model Distribution"
      description="Predictions by model type"
      linkHref="/analytics/ai/predictions"
      linkText="View prediction details"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={prepareModelDistributionData()}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }: { name: string; percent: number }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {prepareModelDistributionData().map((entry, index) => (
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
    </ChartCard>
  );
};

export default ModelDistributionChart;
