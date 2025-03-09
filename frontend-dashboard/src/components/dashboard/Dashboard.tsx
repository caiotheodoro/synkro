import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InventoryOverview from "./InventoryOverview";
import OrderStatus from "./OrderStatus";
import RecentActivity from "./RecentActivity";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Dashboard = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InventoryOverview />
          <OrderStatus />
          <RecentActivity />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Dashboard;
