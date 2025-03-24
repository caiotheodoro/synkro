import React from "react";
import { useInventoryOverview } from "@/api/hooks/useDashboard";

const InventoryOverview = () => {
  const { data, isLoading, error } = useInventoryOverview();

  if (isLoading) {
    return (
      <div className="card-neo animate-pulse">
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-neo">
        <div className="card-header">
          <h3 className="card-title">Inventory Overview</h3>
        </div>
        <div className="card-content">
          <div className="text-red-500">Error loading inventory data</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="card-neo">
      <div className="card-header">
        <h3 className="card-title">Inventory Overview</h3>
        <p className="card-description">Current stock levels and alerts</p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total SKUs</span>
            <span className="font-bold">
              {data.total_items.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Low Stock Alerts</span>
            <span className="font-bold text-red-500">
              {data.low_stock_count.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Overstock Items</span>
            <span className="font-bold text-amber-500">
              {data.overstock_count.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Quantity</span>
            <span className="font-bold">
              {data.total_quantity.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Value</span>
            <span className="font-bold text-green-600">
              {formatCurrency(data.total_value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryOverview;
