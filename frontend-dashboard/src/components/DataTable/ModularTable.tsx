import React from "react";

export interface Column {
  field: string;
  header: string;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface TableAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: any) => void;
  variant?: "primary" | "secondary" | "danger";
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
  emptyMessage = "No data available",
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
    const fields = field.split(".");
    let value = item;

    for (const f of fields) {
      if (value === null || value === undefined) return "";
      value = value[f];
    }

    return value;
  };

  const hasActions = actions && actions.length > 0;

  const renderActionButtons = (item: any) => {
    if (!hasActions) return null;

    return actions.map((action, actionIndex) => {
      const buttonClasses = {
        primary: "bg-blue-500 hover:bg-blue-600 text-white border-black",
        secondary: "bg-gray-200 hover:bg-gray-300 text-black border-black",
        danger: "bg-red-500 hover:bg-red-600 text-white border-black",
      };

      const variant = action.variant || "primary";

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
    });
  };

  return (
    <div className="relative bg-white rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full">
      <div className="w-full overflow-auto">
        <div className="inline-block min-w-full">
          <div className="border-b-4 border-black bg-gray-50 flex w-full">
            {columns.map((column, index) => (
              <div
                key={index}
                className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[150px] flex-shrink-0"
              >
                {column.header}
              </div>
            ))}
            <div className="flex-grow"></div>
            {hasActions && (
              <div className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-[170px] flex-shrink-0 sticky right-0 bg-gray-50 border-l-2 border-gray-300">
                Actions
              </div>
            )}
          </div>

          <div className="bg-white">
            {data.map((item, rowIndex) => (
              <div
                key={rowIndex}
                className="flex w-full hover:bg-gray-50 border-b border-gray-200"
              >
                {columns.map((column, colIndex) => (
                  <div
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap min-w-[150px] flex-shrink-0"
                  >
                    {column.render ? (
                      column.render(getValue(item, column.field), item)
                    ) : (
                      <div className="text-sm">
                        {getValue(item, column.field)}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex-grow"></div>
                {hasActions && (
                  <div className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-[170px] flex-shrink-0 sticky right-0 bg-white border-l-2 border-gray-300">
                    <div className="flex space-x-2 justify-end">
                      {renderActionButtons(item)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
