import React from 'react';
import { cn } from '@/utils/cn';

export interface Column<T = any> {
  field: string;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  actions?: TableAction<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  actions,
  isLoading = false,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) => {
  const getValue = (item: T, field: string) => {
    // Handle nested fields like 'user.name'
    const keys = field.split('.');
    let value: any = item;
    
    for (const key of keys) {
      if (value === null || value === undefined) return null;
      value = value[key];
    }
    
    return value;
  };

  const renderCell = (item: T, column: Column<T>) => {
    const value = getValue(item, column.field);
    
    if (column.render) {
      return column.render(value, item);
    }
    
    return value?.toString() || '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 border-b-3 border-black">
          <tr>
            {columns.map((column) => (
              <th
                key={column.field}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.field} className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">{renderCell(item, column)}</div>
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(item)}
                        className={cn(
                          "inline-flex items-center px-2.5 py-1.5 border-2 border-black rounded text-xs font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all",
                          action.variant === 'primary' && "bg-red-500 hover:bg-red-600 text-white",
                          action.variant === 'secondary' && "bg-blue-500 hover:bg-blue-600 text-white",
                          action.variant === 'danger' && "bg-red-600 hover:bg-red-700 text-white",
                          action.variant === 'outline' && "bg-white hover:bg-gray-100",
                          !action.variant && "bg-white hover:bg-gray-100"
                        )}
                      >
                        {action.icon && <span className="mr-1">{action.icon}</span>}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 