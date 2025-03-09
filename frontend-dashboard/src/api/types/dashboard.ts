export interface InventoryOverview {
  total_items: number;
  low_stock_count: number;
  overstock_count: number;
  total_quantity: number;
  total_value: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface OrderStatusOverview {
  status_counts: OrderStatusCount[];
  total_orders: number;
}

export interface DashboardOverview {
  inventory: InventoryOverview;
  orders: OrderStatusOverview;
}

export interface ActivityItem {
  id: string;
  type: "order" | "shipment" | "inventory" | "system";
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "error" | "success";
  entityId?: string;
  entityType?: string;
}

export interface RecentActivitiesResponse {
  activities: ActivityItem[];
}
