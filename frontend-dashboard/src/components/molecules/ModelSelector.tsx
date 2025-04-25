import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import ModelButton from "../atoms/ModelButton";
import { IModel } from "@/services/ai-prediction.service";

interface ModelSelectorProps {
  models: IModel[];
  selectedModel: string;
  onModelSelect: (modelName: string) => void;
  isLoading: boolean;
}

const ModelSelector = ({
  models,
  selectedModel,
  onModelSelect,
  isLoading,
}: ModelSelectorProps) => {
  return (
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
              <ModelButton
                key={model.name}
                name={model.name}
                isSelected={selectedModel === model.name}
                onClick={() => onModelSelect(model.name)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
