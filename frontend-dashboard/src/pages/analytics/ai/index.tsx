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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI/ML Analytics Dashboard</h1>
        <Link href="/analytics/ai/predictions">
          <Button className="flex items-center gap-2">
            View Detailed Predictions
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-4 border-[#8884d8] hover:shadow-neo transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Total Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  stats.totalPredictions
                )}
              </div>
              <div className="p-2 bg-[#8884d8]/20 rounded-full">
                <Database className="h-6 w-6 text-[#8884d8]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-[#00C49F] hover:shadow-neo transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Available Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats.totalModels
                )}
              </div>
              <div className="p-2 bg-[#00C49F]/20 rounded-full">
                <Brain className="h-6 w-6 text-[#00C49F]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-[#FFBB28] hover:shadow-neo transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Avg. Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  `${(stats.averageConfidence * 100).toFixed(1)}%`
                )}
              </div>
              <div className="p-2 bg-[#FFBB28]/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-[#FFBB28]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-[#FF8042] hover:shadow-neo transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Last 24h Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats.recentPredictions
                )}
              </div>
              <div className="p-2 bg-[#FF8042]/20 rounded-full">
                <Activity className="h-6 w-6 text-[#FF8042]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Model Distribution */}
        <Card className="hover:shadow-neo transition-shadow">
          <CardHeader>
            <CardTitle>Model Distribution</CardTitle>
            <CardDescription>Predictions by model type</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
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
                    label={({
                      name,
                      percent,
                    }: {
                      name: string;
                      percent: number;
                    }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {prepareModelDistributionData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} predictions`,
                      "Count",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <CardFooter className="border-t border-gray-200">
            <Link
              href="/analytics/ai/predictions"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              View prediction details
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>

        {/* Confidence Distribution */}
        <Card className="hover:shadow-neo transition-shadow">
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
            <CardDescription>
              Distribution of prediction confidence scores
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareConfidenceDistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} predictions`,
                      "Count",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Confidence Range" fill="#ff5470" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <CardFooter className="border-t border-gray-200">
            <Link
              href="/analytics/ai/predictions"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              View confidence details
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Predictions */}
      <Card className="hover:shadow-neo transition-shadow">
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
          <CardDescription>Latest model predictions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            Array(5)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-16 w-full mb-4" />)
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-3 border-black">
                    <th className="text-left font-bold p-4">ID</th>
                    <th className="text-left font-bold p-4">Item ID</th>
                    <th className="text-left font-bold p-4">Model</th>
                    <th className="text-right font-bold p-4">Prediction</th>
                    <th className="text-right font-bold p-4">Confidence</th>
                    <th className="text-right font-bold p-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions?.slice(0, 5)?.map((prediction) => (
                    <tr
                      key={prediction?.id || Math.random().toString()}
                      className="border-b hover:bg-gray-100"
                    >
                      <td className="p-4 font-mono">
                        {typeof prediction?.id === "string"
                          ? prediction.id.slice(0, 8)
                          : prediction?.id
                          ? String(prediction.id).slice(0, 8)
                          : "N/A"}
                      </td>
                      <td className="p-4 font-mono">
                        {typeof prediction?.item_id === "string"
                          ? prediction?.item_id?.slice(0, 8)
                          : "N/A"}
                      </td>
                      <td className="p-4">{prediction?.model_name || "N/A"}</td>
                      <td className="p-4 text-right">
                        {prediction?.predicted_demand !== undefined
                          ? prediction?.predicted_demand?.toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            prediction?.confidence_score > 0.7
                              ? "bg-green-100 text-green-800"
                              : prediction?.confidence_score > 0.4
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {prediction?.confidence_score !== undefined
                            ? (prediction?.confidence_score * 100).toFixed(1) +
                              "%"
                            : "N/A"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {prediction?.timestamp
                          ? new Date(prediction.timestamp).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-gray-200">
          <Link href="/analytics/ai/predictions" className="w-full">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              View All Predictions
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIAnalyticsPage;
