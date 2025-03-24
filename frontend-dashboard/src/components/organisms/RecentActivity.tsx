import React from "react";
import { useRecentActivities, ActivityItem } from "@/api/hooks/useDashboard";

const activityTypeColorMap = {
  order: "bg-blue-500",
  shipment: "bg-green-500",
  inventory: "bg-yellow-500",
  system: "bg-purple-500",
};

const severityColorMap = {
  info: "text-blue-600",
  warning: "text-amber-600",
  error: "text-red-600",
  success: "text-green-600",
};

const RecentActivity = () => {
  const { data, isLoading, error } = useRecentActivities(5);

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
          <h3 className="card-title">Recent Activity</h3>
        </div>
        <div className="card-content">
          <div className="text-red-500">Error loading activity data</div>
        </div>
      </div>
    );
  }

  const activities =
    data && data.length > 0
      ? data
      : ([
          {
            id: "1",
            type: "order",
            message: "New order received",
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            severity: "info",
          },
          {
            id: "2",
            type: "shipment",
            message: "Shipment #3321 delivered",
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            severity: "success",
          },
          {
            id: "3",
            type: "inventory",
            message: "Low stock alert: SKU-12345",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            severity: "warning",
          },
        ] as ActivityItem[]);

  return (
    <div className="card-neo">
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>
        <p className="card-description">Latest system events</p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  activityTypeColorMap[activity.type] || "bg-gray-500"
                }`}
              ></div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    severityColorMap[activity.severity] || ""
                  }`}
                >
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const formatRelativeTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return "just now";
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (e) {
    return "Unknown time";
  }
};

export default RecentActivity;
