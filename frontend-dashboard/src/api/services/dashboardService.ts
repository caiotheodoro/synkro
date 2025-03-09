import { ApiService } from "@/services/api.service";
import {
  DashboardOverview,
  InventoryOverview,
  OrderStatusOverview,
  RecentActivitiesResponse,
  ActivityItem,
} from "../types/dashboard";

class DashboardService {
  private readonly apiService: ApiService;

  constructor(apiBaseUrl: string) {
    this.apiService = new ApiService({
      baseUrl: apiBaseUrl,
      timeout: 10000,
    });
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await this.apiService.get<DashboardOverview>(
      "/api/dashboard/overview"
    );
    return response;
  }

  async getInventoryOverview(): Promise<InventoryOverview> {
    const response = await this.apiService.get<InventoryOverview>(
      "/api/dashboard/inventory"
    );
    return response;
  }

  async getOrderStatusOverview(): Promise<OrderStatusOverview> {
    const response = await this.apiService.get<OrderStatusOverview>(
      "/api/dashboard/orders"
    );
    return response;
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    const response = await this.apiService.get<RecentActivitiesResponse>(
      `/api/dashboard/activities?limit=${limit}`
    );
    return response.activities;
  }
}

// Create a dashboardService instance with the API base URL
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const dashboardService = new DashboardService(apiBaseUrl);
