import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { BackofficeLayout } from '@/backoffice/layouts/BackofficeLayout';
import { BackofficeRegistryProvider, useBackofficeRegistry } from '@/backoffice/core/BackofficeRegistry';
import { ListPage } from '@/backoffice/components/ListPage';

// List component to be used inside the registry provider
const ModuleListContainer = () => {
  const router = useRouter();
  const { moduleId } = router.query;
  const { modules, getModuleByPathSegment } = useBackofficeRegistry();
  const [isLoading, setIsLoading] = useState(true);
  const [moduleInstance, setModuleInstance] = useState<any>(null);

  useEffect(() => {
    if (moduleId && typeof moduleId === 'string') {
      console.log("Module ID from URL:", moduleId);
      console.log("Available modules:", Object.keys(modules));
      
      const moduleService = getModuleByPathSegment(moduleId);
      setModuleInstance(moduleService);
      setIsLoading(false);
    }
  }, [moduleId, modules, getModuleByPathSegment]);

  if (isLoading) {
    return <div>Loading module...</div>;
  }
  
  if (!moduleInstance) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
        Module not found: {moduleId} (Available: {Object.keys(modules).join(', ')})
      </div>
    );
  }
  
  return <ListPage module={moduleInstance} />;
};

// Main page component
const ModuleListPage = () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050';
  
  return (
    <BackofficeRegistryProvider apiBaseUrl={apiBaseUrl}>
      <BackofficeLayout>
        <ModuleListContainer />
      </BackofficeLayout>
    </BackofficeRegistryProvider>
  );
};

export default ModuleListPage; 