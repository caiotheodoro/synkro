import React from "react";
import Link from "next/link";
import AnalyticsLayout from "./layout";
import {
  Package,
  ShoppingCart,
  Activity,
  Gauge,
  TrendingUp,
} from "lucide-react";

interface AnalyticsOption {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  metrics: string[];
}

const analyticsOptions: AnalyticsOption[] = [
  {
    title: "Inventory Analytics",
    description: "Track stock levels, distribution, and warehouse efficiency",
    href: "/analytics/inventory",
    icon: <Package className="w-8 h-8" />,
    metrics: [
      "Stock Level Trends",
      "Category Distribution",
      "Warehouse Distribution",
      "Reorder Points",
    ],
  },
  {
    title: "Order Analytics",
    description: "Monitor order flow, lifecycle, and performance metrics",
    href: "/analytics/orders",
    icon: <ShoppingCart className="w-8 h-8" />,
    metrics: [
      "Order Flow Analysis",
      "Order Pipeline",
      "Order Lifecycle",
      "Volume Trends",
    ],
  },
  {
    title: "Transaction Analytics",
    description: "Analyze transaction patterns, volumes, and movements",
    href: "/analytics/transactions",
    icon: <Activity className="w-8 h-8" />,
    metrics: [
      "Transaction Volume",
      "Stock Movements",
      "Pattern Analysis",
      "Data Flow",
    ],
  },
  /*  {
    title: "Performance Analytics",
    description: "Track system performance, health, and resource utilization",
    href: "/analytics/performance",
    icon: <Gauge className="w-8 h-8" />,
    metrics: [
      "Real-time Metrics",
      "Performance Trends",
      "System Health",
      "Resource Usage",
    ],
  },*/
  {
    title: "Business Analytics",
    description: "Gain insights into financial performance and forecasts",
    href: "/analytics/business",
    icon: <TrendingUp className="w-8 h-8" />,
    metrics: [
      "Financial Overview",
      "Revenue Analysis",
      "Data Hierarchy",
      "Predictive Analytics",
    ],
  },
];

const AnalyticsIndex: React.FC = () => {
  return (
    <AnalyticsLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {analyticsOptions.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="block group"
              >
                <div className="h-full bg-white p-6 rounded-lg border-[3px] border-black shadow-neo transition-transform duration-200 hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {option.icon}
                    </div>
                    <h3 className="text-xl font-bold ml-4">{option.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{option.description}</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      Key Metrics
                    </h4>
                    <ul className="space-y-1">
                      {option.metrics.map((metric, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-center"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
};

export default AnalyticsIndex;
