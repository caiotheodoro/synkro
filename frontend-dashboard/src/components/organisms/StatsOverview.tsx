import { Brain, Database, TrendingUp, Activity } from "lucide-react";
import StatsCard from "../atoms/StatsCard";

interface StatsOverviewProps {
  stats: {
    totalPredictions: number;
    totalModels: number;
    averageConfidence: number;
    recentPredictions: number;
  };
  isLoading: boolean;
}

const StatsOverview = ({ stats, isLoading }: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Total Predictions"
        value={stats.totalPredictions}
        icon={Database}
        color="#8884d8"
        isLoading={isLoading}
      />
      <StatsCard
        title="Available Models"
        value={stats.totalModels}
        icon={Brain}
        color="#00C49F"
        isLoading={isLoading}
      />
      <StatsCard
        title="Avg. Confidence"
        value={`${(stats.averageConfidence * 100).toFixed(1)}%`}
        icon={TrendingUp}
        color="#FFBB28"
        isLoading={isLoading}
      />
      <StatsCard
        title="Last 24h Predictions"
        value={stats.recentPredictions}
        icon={Activity}
        color="#FF8042"
        isLoading={isLoading}
      />
    </div>
  );
};

export default StatsOverview;
