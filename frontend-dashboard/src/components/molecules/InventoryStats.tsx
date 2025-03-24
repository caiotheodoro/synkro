import React from "react";
import { Package, AlertTriangle, TrendingUp } from "lucide-react";
import { StatsCard } from "@/backoffice/components";

interface InventoryStatsProps {
  data: any[];
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatsCard
        title="Total Items"
        value={data.length}
        icon={<Package className="w-6 h-6" />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />

      <StatsCard
        title="Low Stock Alerts"
        value={
          data.filter(
            (item) =>
              item.status === "Low Stock" ||
              (item.quantity < item.minQuantity && item.quantity > 0)
          ).length
        }
        icon={<AlertTriangle className="w-6 h-6" />}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
      />

      <StatsCard
        title="Out of Stock"
        value={
          data.filter(
            (item) => item.status === "Out of Stock" || item.quantity === 0
          ).length
        }
        icon={<TrendingUp className="w-6 h-6" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
    </div>
  );
};
