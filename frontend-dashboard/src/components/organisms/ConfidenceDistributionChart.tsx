import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "../molecules/ChartCard";
import { IPrediction } from "@/services/ai-prediction.service";

interface ConfidenceDistributionChartProps {
  predictions: IPrediction[];
  isLoading: boolean;
}

const ConfidenceDistributionChart = ({
  predictions,
  isLoading,
}: ConfidenceDistributionChartProps) => {
  const prepareConfidenceDistributionData = () => {
    const confidenceRanges = [
      { name: "0.0-0.2", range: [0, 0.2], count: 0 },
      { name: "0.2-0.4", range: [0.2, 0.4], count: 0 },
      { name: "0.4-0.6", range: [0.4, 0.6], count: 0 },
      { name: "0.6-0.8", range: [0.6, 0.8], count: 0 },
      { name: "0.8-1.0", range: [0.8, Infinity], count: 0 },
    ];

    predictions.forEach((p) => {
      if (p?.confidence_score === undefined) return;
      const value = p.confidence_score;
      for (const range of confidenceRanges) {
        if (value >= range.range[0] && value < range.range[1]) {
          range.count++;
          break;
        }
      }
    });

    return confidenceRanges;
  };

  return (
    <ChartCard
      title="Confidence Distribution"
      description="Distribution of prediction confidence scores"
      linkHref="/analytics/ai/predictions"
      linkText="View confidence details"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={prepareConfidenceDistributionData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`${value} predictions`, "Count"]}
          />
          <Legend />
          <Bar dataKey="count" name="Confidence Range" fill="#ff5470" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default ConfidenceDistributionChart;
