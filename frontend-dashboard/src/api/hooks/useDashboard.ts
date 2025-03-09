import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type {
  DashboardOverview,
  InventoryOverview,
  OrderStatusOverview,
  OrderStatusCount,
  ActivityItem,
} from "../types/dashboard";

// React Query Hooks
export const useDashboardOverview = () => {
  return useQuery<DashboardOverview, Error>({
    queryKey: ["dashboardOverview"],
    queryFn: () => dashboardService.getDashboardOverview(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
};

export const useInventoryOverview = () => {
  return useQuery<InventoryOverview, Error>({
    queryKey: ["inventoryOverview"],
    queryFn: () => dashboardService.getInventoryOverview(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
};

export const useOrderStatusOverview = () => {
  return useQuery<OrderStatusOverview, Error>({
    queryKey: ["orderStatusOverview"],
    queryFn: () => dashboardService.getOrderStatusOverview(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
};

export const useRecentActivities = (limit: number = 10) => {
  return useQuery<ActivityItem[], Error>({
    queryKey: ["recentActivities", limit],
    queryFn: () => dashboardService.getRecentActivities(limit),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
};

// Re-export types for convenience
export type {
  DashboardOverview,
  InventoryOverview,
  OrderStatusOverview,
  OrderStatusCount,
  ActivityItem,
};
