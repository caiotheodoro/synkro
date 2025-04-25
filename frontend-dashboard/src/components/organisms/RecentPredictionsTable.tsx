import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { IPrediction } from "@/services/ai-prediction.service";

interface RecentPredictionsTableProps {
  predictions: IPrediction[];
  isLoading: boolean;
}

const RecentPredictionsTable = ({
  predictions,
  isLoading,
}: RecentPredictionsTableProps) => {
  return (
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
  );
};

export default RecentPredictionsTable;
