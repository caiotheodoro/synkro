import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { IPrediction } from "@/services/ai-prediction.service";
import ConfidenceIndicator from "../atoms/ConfidenceIndicator";

interface DetailedPredictionsTableProps {
  predictions: IPrediction[];
  selectedModel: string;
  isLoading: boolean;
}

const DetailedPredictionsTable = ({
  predictions,
  selectedModel,
  isLoading,
}: DetailedPredictionsTableProps) => {
  return (
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
                      <td className="p-4">{prediction?.model_name || "N/A"}</td>
                      <td className="p-4 text-right">
                        {prediction?.predicted_demand !== undefined
                          ? prediction.predicted_demand.toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="p-4 text-right">
                        {prediction?.confidence_score !== undefined ? (
                          <ConfidenceIndicator
                            score={prediction.confidence_score}
                          />
                        ) : (
                          "N/A"
                        )}
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
  );
};

export default DetailedPredictionsTable;
