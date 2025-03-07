import React from 'react';

export interface Column {
  field: string;
  header: string;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface TableAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: any) => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ModularTableProps {
  data: any[];
  columns: Column[];
  actions?: TableAction[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const ModularTable: React.FC<ModularTableProps> = ({
  data,
  columns,
  actions,
  isLoading = false,
  emptyMessage = 'No data available'
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center items-center h-40">
          <p className="text-lg text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const getValue = (item: any, field: string) => {
    const fields = field.split('.');
    let value = item;
    
    for (const f of fields) {
      if (value === null || value === undefined) return '';
      value = value[f];
    }
    
    return value;
  };

  return (
    <div className="bg-white rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-4 border-black">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                  {column.header}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? (
                      column.render(getValue(item, column.field), item)
                    ) : (
                      <div className="text-sm">{getValue(item, column.field)}</div>
                    )}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      {actions.map((action, actionIndex) => {
                        const buttonClasses = {
                          primary: 'bg-blue-500 hover:bg-blue-600 text-white border-black',
                          secondary: 'bg-gray-200 hover:bg-gray-300 text-black border-black',
                          danger: 'bg-red-500 hover:bg-red-600 text-white border-black'
                        };
                        
                        const variant = action.variant || 'primary';
                        
                        return (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(item)}
                            className={`${buttonClasses[variant]} px-3 py-1 rounded border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-medium flex items-center`}
                          >
                            {action.icon && <span className="mr-1">{action.icon}</span>}
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 