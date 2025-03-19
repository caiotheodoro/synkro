import React from "react";
import { BackofficeLayout } from "@/backoffice/layouts/BackofficeLayout";

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({ children }) => {
  return (
    <BackofficeLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-neo">
          {children}
        </div>
      </div>
    </BackofficeLayout>
  );
};

export default AnalyticsLayout;
