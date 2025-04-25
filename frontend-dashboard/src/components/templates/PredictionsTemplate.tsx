import { IPrediction, IModel } from "@/services/ai-prediction.service";
import PageHeader from "../molecules/PageHeader";
import ModelSelector from "../molecules/ModelSelector";
import TimeSeriesChart from "../organisms/TimeSeriesChart";
import ItemDistributionChart from "../organisms/ItemDistributionChart";
import PredictionDistributionChart from "../organisms/PredictionDistributionChart";
import ConfidenceScoreChart from "../organisms/ConfidenceScoreChart";
import DetailedPredictionsTable from "../organisms/DetailedPredictionsTable";

interface PredictionsTemplateProps {
  predictions: IPrediction[];
  models: IModel[];
  selectedModel: string;
  isLoading: boolean;
  onModelSelect: (modelName: string) => void;
  onGenerateClick: () => void;
}

const PredictionsTemplate = ({
  predictions,
  models,
  selectedModel,
  isLoading,
  onModelSelect,
  onGenerateClick,
}: PredictionsTemplateProps) => {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        onGenerateClick={onGenerateClick}
        isGenerateDisabled={isLoading || !selectedModel}
      />

      <div className="mb-8">
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onModelSelect={onModelSelect}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TimeSeriesChart
          predictions={predictions}
          selectedModel={selectedModel}
          isLoading={isLoading}
        />

        <ItemDistributionChart
          predictions={predictions}
          selectedModel={selectedModel}
          isLoading={isLoading}
        />

        <PredictionDistributionChart
          predictions={predictions}
          selectedModel={selectedModel}
          isLoading={isLoading}
        />

        <ConfidenceScoreChart
          predictions={predictions}
          selectedModel={selectedModel}
          isLoading={isLoading}
        />
      </div>

      <DetailedPredictionsTable
        predictions={predictions}
        selectedModel={selectedModel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PredictionsTemplate;
