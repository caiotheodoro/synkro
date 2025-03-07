import React, { ReactNode } from 'react';
import { useBackofficeStore, BackofficeModule } from './BackofficeStore';

export type { BackofficeModule };

export const useBackofficeRegistry = () => {
  const { modules, getModule, getModuleByPathSegment } = useBackofficeStore();
  return { modules, getModule, getModuleByPathSegment };
};

interface BackofficeRegistryProviderProps {
  children: ReactNode;
  apiBaseUrl: string;
}
export const BackofficeRegistryProvider: React.FC<BackofficeRegistryProviderProps> = ({
  children,
  apiBaseUrl,
}) => {
  const initialize = useBackofficeStore(state => state.initialize);
  
  React.useEffect(() => {
    initialize(apiBaseUrl);
  }, [apiBaseUrl, initialize]);

  return <>{children}</>;
}; 