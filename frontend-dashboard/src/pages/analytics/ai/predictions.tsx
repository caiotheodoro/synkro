import { useEffect, useState } from "react";
import { NextPage } from "next";
import { Button } from "@/components/ui/Button";
import {
  AIPredictionService,
  IPrediction,
  IModel,
} from "@/services/ai-prediction.service";
import PredictionsTemplate from "@/components/templates/PredictionsTemplate";
import AnalyticsLayout from "../layout";

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

  const handleGenerateNewPrediction = async () => {
    if (!selectedModel) return;

    try {
      setError(null);
      const response = await predictionService.generatePrediction();
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

  return (
    <AnalyticsLayout>
      <PredictionsTemplate
        predictions={predictions}
        models={models}
        selectedModel={selectedModel}
        isLoading={isLoading}
        onModelSelect={setSelectedModel}
        onGenerateClick={handleGenerateNewPrediction}
      />
    </AnalyticsLayout>
  );
};

export default PredictionsPage;
