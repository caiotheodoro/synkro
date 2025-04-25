import { useEffect, useState } from "react";
import { NextPage } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  AIPredictionService,
  IPrediction,
  IModel,
} from "@/services/ai-prediction.service";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Brain,
  Database,
  Activity,
} from "lucide-react";
import AnalyticsLayout from "../layout";
import AIAnalyticsTemplate from "@/components/templates/AIAnalyticsTemplate";

const COLORS = ["#FF8042", "#00C49F", "#FFBB28", "#0088FE", "#8884d8"];

const AIAnalyticsPage: NextPage = () => {
  const [predictions, setPredictions] = useState<IPrediction[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    totalModels: 0,
    averageConfidence: 0,
    recentPredictions: 0,
  });

  const predictionService = new AIPredictionService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const predictionData = await predictionService.getPredictions(0, 20);
        setPredictions(predictionData.items);

        const modelData = await predictionService.getModels();
        setModels(modelData.models);

        // Calculate stats
        const avgConfidence =
          predictionData.items.reduce(
            (acc, item) => acc + item.confidence_score,
            0
          ) / (predictionData.items.length || 1);

        // Get predictions from last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentPredictions = predictionData.items.filter(
          (item) => new Date(item.timestamp) > oneDayAgo
        ).length;

        setStats({
          totalPredictions: predictionData.total,
          totalModels: modelData.models.length,
          averageConfidence: avgConfidence,
          recentPredictions,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch AI analytics data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for model distribution chart
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

  // Prepare data for confidence distribution
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

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border-3 border-black shadow-neo p-4 rounded-md">
          <p className="text-red-700 font-bold">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsLayout>
      <AIAnalyticsTemplate
        predictions={predictions}
        models={models}
        isLoading={isLoading}
        stats={stats}
      />
    </AnalyticsLayout>
  );
};

export default AIAnalyticsPage;
