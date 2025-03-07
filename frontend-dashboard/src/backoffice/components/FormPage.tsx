import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DynamicForm } from './DynamicForm';
import { BackofficeModule } from '../core/BackofficeRegistry';
import { BackofficeHeader } from './BackofficeHeader';

interface FormPageProps {
  module: BackofficeModule;
  id?: string;
  isEdit?: boolean;
}

export const FormPage: React.FC<FormPageProps> = ({ module, id, isEdit = false }) => {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const title = isEdit
    ? `Edit ${module.config.title.slice(0, -1)}`
    : `Create ${module.config.title.slice(0, -1)}`;

  useEffect(() => {
    if (isEdit && id) {
      fetchItem();
    }
  }, [id, isEdit]);

  const fetchItem = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await module.fetchItem(id!);
      setInitialValues(response.data || response);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSaving(true);
    setError(null);
    
    try {
      if (isEdit && id) {
        await module.updateItem(id, values);
      } else {
        await module.createItem(values);
      }
      
      router.push(module.getListPath());
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Failed to save data. Please try again later.');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(module.getListPath());
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackofficeHeader 
        title={title}
        subtitle={initialValues?.name || initialValues?.title || ''}
        hasCreateButton={false}
      />
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-4 border-black text-red-700 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {error}
        </div>
      )}
      
      <div className="p-6 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DynamicForm
          config={module.formConfig || { fields: [] }}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}; 