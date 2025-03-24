import React from "react";
import { useOrderStatusOverview } from "@/api/hooks/useDashboard";
import type { OrderStatusCount } from "@/api/types/dashboard";

const statusColorMap: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-gray-100 text-gray-800",
};

const OrderStatus = () => {
  const { data, isLoading, error } = useOrderStatusOverview();

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
          <h3 className="card-title">Order Status</h3>
        </div>
        <div className="card-content">
          <div className="text-red-500">Error loading order data</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="card-neo">
      <div className="card-header">
        <h3 className="card-title">Order Status</h3>
        <p className="card-description">Current order metrics</p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Total Orders</span>
            <span className="font-bold">
              {data.total_orders.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            {data.status_counts.map((statusItem: OrderStatusCount) => (
              <div
                key={statusItem.status}
                className="flex justify-between items-center"
              >
                <div className="flex items-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      statusColorMap[statusItem.status]
                        ? statusColorMap[statusItem.status].split(" ")[0]
                        : "bg-gray-100"
                    }`}
                  ></span>
                  <span className="font-medium">
                    {statusItem.status.charAt(0) +
                      statusItem.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-16 h-3 bg-gray-200 rounded-full mr-2">
                    <div
                      className={`h-3 rounded-full ${
                        statusColorMap[statusItem.status]
                          ? statusColorMap[statusItem.status].split(" ")[0]
                          : "bg-gray-400"
                      }`}
                      style={{
                        width: `${
                          (statusItem.count / data.total_orders) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-bold">{statusItem.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
