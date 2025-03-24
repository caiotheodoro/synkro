import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BackofficeLayout } from "@/backoffice/layouts/BackofficeLayout";
import {
  BackofficeRegistryProvider,
  useBackofficeRegistry,
} from "@/backoffice/core/builders/BackofficeRegistry";
import { FormPage } from "@/backoffice/components";

const ModuleEditContainer = () => {
  const router = useRouter();
  const { moduleId, id } = router.query;
  const { modules, getModuleByPathSegment } = useBackofficeRegistry();
  const [isLoading, setIsLoading] = useState(true);
  const [moduleInstance, setModuleInstance] = useState<any>(null);

  useEffect(() => {
    if (moduleId && typeof moduleId === "string") {
      const module = getModuleByPathSegment(moduleId);
      setModuleInstance(module);
      setIsLoading(false);
    }
  }, [moduleId, modules, getModuleByPathSegment]);

  if (isLoading) {
    return <div>Loading module...</div>;
  }

  if (!moduleInstance) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
        Module not found: {moduleId} (Available:{" "}
        {Object.keys(modules).join(", ")})
      </div>
    );
  }

  if (!id) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
        ID is required
      </div>
    );
  }

  return <FormPage module={moduleInstance} id={id as string} isEdit={true} />;
};

const ModuleEditPage = () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  return (
    <BackofficeRegistryProvider apiBaseUrl={apiBaseUrl}>
      <BackofficeLayout>
        <ModuleEditContainer />
      </BackofficeLayout>
    </BackofficeRegistryProvider>
  );
};

export default ModuleEditPage;
