import React from 'react';
import { BackofficeDetailConfig } from '../core/BackofficeBuilder';

interface DetailViewProps {
  data: Record<string, any>;
  config: BackofficeDetailConfig;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  relatedEntities?: Record<string, any[]>;
}

export const DetailView: React.FC<DetailViewProps> = ({
  data,
  config,
  onEdit,
  onDelete,
  onBack,
  isLoading = false,
  relatedEntities = {},
}) => {
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  };

  const renderValue = (field: { label: string; field: string; render?: (value: any, item: any) => React.ReactNode }) => {
    const value = getNestedValue(data, field.field);
    
    if (field.render) {
      return field.render(value, data);
    }
    
    if (value === null || value === undefined) {
      return <span className="text-neutral-400">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      
      return JSON.stringify(value);
    }
    
    return value;
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-neutral-300 rounded-md shadow-md">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1 text-black bg-white border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
            >
              Back
            </button>
          )}
          <h2 className="text-xl font-bold">{data?.name || data?.title || `Detail View`}</h2>
        </div>
        
        <div className="flex space-x-2">
          {config.actions?.map((action, index) => (
            <button
              key={index}
              onClick={() => action.action(data)}
              className="px-3 py-1 text-black bg-white border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
            >
              {action.label}
            </button>
          ))}
          
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 text-white bg-blue-500 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600"
            >
              Edit
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1 text-white bg-red-500 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      {config.sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="p-6 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <h3 className="mb-4 text-xl font-bold border-b-4 border-black pb-2">{section.title}</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {section.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="mb-2">
                <div className="text-sm font-medium text-black uppercase">{field.label}</div>
                <div className="mt-1 font-medium">{renderValue(field)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {config.relatedEntities && Object.keys(relatedEntities).length > 0 && (
        <div className="mt-4">
          {config.relatedEntities.map((relatedEntity, index) => {
            const entityData = relatedEntities[relatedEntity.entity] || [];
            
            return (
              <div key={index} className="p-6 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
                <h3 className="mb-4 text-xl font-bold border-b-4 border-black pb-2">{relatedEntity.title}</h3>
                
                {entityData.length === 0 ? (
                  <p className="text-neutral-500">No {relatedEntity.title.toLowerCase()} found</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {entityData.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="p-4 border-2 border-black rounded-md bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                      >
                        {relatedEntity.display(item)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 