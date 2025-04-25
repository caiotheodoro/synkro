import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IPrediction, IModel } from "@/services/ai-prediction.service";
import StatsOverview from "../organisms/StatsOverview";
import ModelDistributionChart from "../organisms/ModelDistributionChart";
import ConfidenceDistributionChart from "../organisms/ConfidenceDistributionChart";
import RecentPredictionsTable from "../organisms/RecentPredictionsTable";

interface AIAnalyticsTemplateProps {
  predictions: IPrediction[];
  models: IModel[];
  isLoading: boolean;
  stats: {
    totalPredictions: number;
    totalModels: number;
    averageConfidence: number;
    recentPredictions: number;
  };
}

const AIAnalyticsTemplate = ({
  predictions,
  models,
  isLoading,
  stats,
}: AIAnalyticsTemplateProps) => {
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

      <StatsOverview stats={stats} isLoading={isLoading} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <ModelDistributionChart
          predictions={predictions}
          isLoading={isLoading}
        />
        <ConfidenceDistributionChart
          predictions={predictions}
          isLoading={isLoading}
        />
      </div>

      <RecentPredictionsTable predictions={predictions} isLoading={isLoading} />
    </div>
  );
};

export default AIAnalyticsTemplate;
