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
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PlusCircle, ArrowLeft } from "lucide-react";

const COLORS = ["#FF8042", "#00C49F", "#FFBB28", "#0088FE", "#8884d8"];

const PredictionsPage: NextPage = () => {
  const [predictions, setPredictions] = useState<IPrediction[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const predictionService = new AIPredictionService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const predictionData = await predictionService.getPredictions(0, 50);
        console.log(predictionData);
        setPredictions(predictionData.items);

        const modelData = await predictionService.getModels();
        setModels(modelData.models);

        if (modelData.models.length > 0) {
          setSelectedModel(modelData.models[0].name);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch prediction data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for charts
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

  const prepareConfidenceData = () => {
    return predictions
      .filter((p) => p?.model_name === selectedModel)
      .map((p) => ({
        itemId:
          typeof p?.item_id === "string" ? p.item_id.slice(0, 8) : "Unknown",
        confidenceScore: p?.confidence_score || 0,
      }));
  };

  const handleGenerateNewPrediction = async () => {
    if (!selectedModel) return;

    try {
      setError(null);
      // Use a random existing item ID for simplicity
      const randomItem =
        predictions[Math.floor(Math.random() * predictions.length)];

      if (!randomItem) {
        setError("No existing items found to generate a prediction for");
        return;
      }

      const response = await predictionService.generatePrediction(
        randomItem.item_id,
        selectedModel
      );

      // Add new prediction to the state
      setPredictions((prev) => [response, ...prev]);
    } catch (error) {
      console.error("Error generating prediction:", error);
      setError("Failed to generate a new prediction");
    }
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

  console.log(predictions);
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Link href="/analytics/ai">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">AI/ML Predictions Analysis</h1>
        </div>
        <Button
          onClick={handleGenerateNewPrediction}
          disabled={isLoading || !selectedModel}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Generate New Prediction
        </Button>
      </div>

      {/* Model Selector */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>ML Model Selection</CardTitle>
            <CardDescription>
              Select a model to view its predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {models.map((model) => (
                  <Button
                    key={model.name}
                    variant={
                      selectedModel === model.name ? "primary" : "outline"
                    }
                    onClick={() => setSelectedModel(model.name)}
                    className="w-full"
                  >
                    {model.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Time Series Chart */}
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

        {/* Item Distribution Chart */}
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

        {/* Prediction Distribution Chart */}
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
                    label={({
                      name,
                      percent,
                    }: {
                      name: string;
                      percent: number;
                    }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {preparePredictionDistributionData().map((entry, index) => (
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
        </Card>

        {/* Confidence Score Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Confidence Scores</CardTitle>
            <CardDescription>
              Confidence scores for each prediction
            </CardDescription>
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
      </div>

      {/* Recent Predictions Table */}
      <Card className="mt-8">
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
                  {predictions
                    .filter((p) => p?.model_name === selectedModel)
                    .slice(0, 10)
                    .map((prediction) => (
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
                            ? prediction.item_id.slice(0, 8)
                            : "N/A"}
                        </td>
                        <td className="p-4">
                          {prediction?.model_name || "N/A"}
                        </td>
                        <td className="p-4 text-right">
                          {prediction?.predicted_demand !== undefined
                            ? prediction.predicted_demand.toFixed(3)
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
                              ? (prediction.confidence_score * 100).toFixed(1) +
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
      </Card>
    </div>
  );
};

export default PredictionsPage;
