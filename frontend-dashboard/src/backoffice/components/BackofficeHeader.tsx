import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BackofficeModule } from '../core/BackofficeRegistry';

interface BackofficeHeaderProps {
  title: string;
  subtitle?: string;
  module?: BackofficeModule;
  onCreateClick?: () => void;
  hasCreateButton?: boolean;
}

export const BackofficeHeader: React.FC<BackofficeHeaderProps> = ({
  title,
  subtitle,
  module,
  onCreateClick,
  hasCreateButton = true
}) => {
  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      
      {hasCreateButton && onCreateClick && (
        <Button variant="primary" onClick={handleCreateClick} className="mt-4 md:mt-0">
          <Plus className="w-5 h-5 mr-2" />
          Add {module ? module.config.title.replace(/s$/, '') : 'New'}
        </Button>
      )}
    </div>
  );
}; 