import React from 'react';
import { useRouter } from 'next/router';
import { BackofficeLayout } from '@/backoffice/layouts/BackofficeLayout';
import { BackofficeRegistryProvider, useBackofficeRegistry } from '@/backoffice/core/BackofficeRegistry';

// Dashboard component to be used inside the registry provider
const BackofficeDashboard = () => {
  const router = useRouter();
  const { modules } = useBackofficeRegistry();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(modules).map(([key, module]) => (
          <div
            key={key}
            className="p-6 bg-white border-4 border-black rounded-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            onClick={() => router.push(`/backoffice/${key}`)}
          >
            <h2 className="text-xl font-bold mb-2">{module.config.title}</h2>
            <p className="text-neutral-600">Manage your {module.config.title.toLowerCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main page component
const BackofficeIndexPage = () => {
  // Use environment variable but remove the trailing /api if present
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
  
  return (
    <BackofficeRegistryProvider apiBaseUrl={apiBaseUrl}>
      <BackofficeLayout>
        <BackofficeDashboard />
      </BackofficeLayout>
    </BackofficeRegistryProvider>
  );
};

export default BackofficeIndexPage; 