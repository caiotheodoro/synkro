import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  isLoading?: boolean;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  isLoading = false,
}: StatsCardProps) => {
  return (
    <Card
      className={`border-4 border-[${color}] hover:shadow-neo transition-shadow`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-24" /> : value}
          </div>
          <div className={`p-2 bg-[${color}]/20 rounded-full`}>
            <Icon className={`h-6 w-6 text-[${color}]`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
