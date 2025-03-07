import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { BackofficeModule } from '../core/BackofficeRegistry';
import { DataTable, Column, TableAction } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryStats } from '@/components/InventoryStats';

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface ListPageProps {
  module: BackofficeModule;
}

export const ListPage: React.FC<ListPageProps> = ({ module }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Query key based on module and search/filter params
  const queryKey = [module.config.title, debouncedSearchTerm, filters];

  // Set up React Query for data fetching
  const { data = [], isLoading, error: queryError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, any> = { ...filters };
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }
      
      return module.fetchList(params);
    },
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    select: (response: any) => response.data || response,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Set up mutation for delete operations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => module.deleteItem(id),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }));
  };

  const handleEdit = (item: any) => {
    router.push(module.getEditPath(item.id));
  };

  const handleView = (item: any) => {
    router.push(module.getDetailPath(item.id));
  };

  const handleDelete = async (item: any) => {
    if (window.confirm(`Are you sure you want to delete this ${module.config.title.toLowerCase()}?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleCreate = () => {
    router.push(module.getCreatePath());
  };

  // Convert module column configuration to our DataTable format
  const columns: Column[] = module.listConfig?.columns.map((col: any) => ({
    field: col.field,
    header: col.header,
    render: col.render,
  })) || [];

  // Define table actions
  const actions: TableAction[] = [
    {
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView,
      variant: 'outline'
    },
    {
      label: 'Edit',
      icon: <Pencil className="w-4 h-4" />,
      onClick: handleEdit,
      variant: 'secondary'
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: 'danger'
    }
  ];

  // Get error message from mutation or query
  const error = deleteMutation.error || queryError;
  const errorMessage = error ? 'Failed to load or update data. Please try again later.' : null;

  // Check if we should render stats (only for inventory module)
  const shouldRenderStats = module.config.title === 'Inventory';

  return (
    <div className="p-6">
      {/* Header with title and add button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{module.config.title}</h1>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
            {isLoading && searchTerm && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              </div>
            )}
          </div>
          
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="w-5 h-5 mr-2" /> Add {module.config.title.replace(/s$/, '')}
          </Button>
        </div>
      </div>
      
      {/* Stats Cards - Only render for inventory module */}
      {shouldRenderStats && (
        <InventoryStats data={data} />
      )}
      
      {/* Error message */}
      {errorMessage && (
        <div className="p-4 mb-6 bg-red-100 border-3 border-black text-red-700 rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {errorMessage}
        </div>
      )}
      
      {/* Data Table */}
      <div className="bg-white border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">{module.config.title}</h2>
        </div>
        <div>
          <DataTable
            data={data}
            columns={columns}
            actions={actions}
            isLoading={isLoading || deleteMutation.isPending}
            emptyMessage={`No ${module.config.title.toLowerCase()} found`}
          />
        </div>
      </div>
    </div>
  );
}; 