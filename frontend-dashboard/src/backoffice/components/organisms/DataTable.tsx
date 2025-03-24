import React, { useState } from "react";
import { BackofficeListConfig } from "@/backoffice/core/builders/BackofficeBuilder";

interface DataTableProps {
  data: any[];
  config: BackofficeListConfig;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  config,
  onEdit,
  onDelete,
  onView,
}) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortField);
      const bValue = getNestedValue(b, sortField);

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  const handleRowClick = (item: any) => {
    if (onView) {
      onView(item);
    }
  };

  const handleSelectItem = (item: any, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedItems(isSelected ? [...data] : []);
  };

  const renderCell = (
    item: any,
    column: {
      field: string;
      header: string;
      render?: (value: any, item: any) => React.ReactNode;
    }
  ) => {
    const value = getNestedValue(item, column.field);

    if (column.render) {
      return column.render(value, item);
    }

    return value;
  };

  const hasActions =
    onEdit || onDelete || (config.actions && config.actions.length > 0);

  const hasBulkActions =
    config.bulkActions &&
    config.bulkActions.length > 0 &&
    selectedItems.length > 0;
  return (
    <div className="overflow-hidden rounded-md border border-neutral-300 shadow-md">
      <div className="bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-bold">Results ({data.length})</h3>

          {hasBulkActions && (
            <div className="flex space-x-2">
              {config?.bulkActions?.map((action, index) => (
                <button
                  key={index}
                  onClick={() => action.action(selectedItems)}
                  className="px-4 py-2 text-white bg-orange-500 border-4 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-300">
          <thead className="bg-neutral-100">
            <tr>
              {config.bulkActions && config.bulkActions.length > 0 && (
                <th className="p-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-2 border-black rounded"
                    checked={
                      selectedItems.length === data.length && data.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}

              {config.columns.map((column, index) => (
                <th
                  key={index}
                  className="p-4 text-left font-bold cursor-pointer"
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {sortField === column.field && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {hasActions && (
                <th className="p-4 text-right sticky right-0 bg-neutral-100 z-10 min-w-[170px]">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-300">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    config.columns.length +
                    (config.bulkActions && config.bulkActions.length > 0
                      ? 1
                      : 0) +
                    (hasActions ? 1 : 0)
                  }
                  className="p-4 text-center text-neutral-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              sortedData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  {config.bulkActions && config.bulkActions.length > 0 && (
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-2 border-black rounded"
                        checked={selectedItems.some((i) => i.id === item.id)}
                        onChange={(e) =>
                          handleSelectItem(item, e.target.checked)
                        }
                      />
                    </td>
                  )}

                  {config.columns.map((column, colIndex) => (
                    <td key={colIndex} className="p-4 whitespace-nowrap">
                      {renderCell(item, column)}
                    </td>
                  ))}

                  {hasActions && (
                    <td
                      className="p-4 text-right sticky right-0 bg-white z-10 min-w-[170px] shadow-[-4px_0_4px_rgba(0,0,0,0.05)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end space-x-2">
                        {config.actions?.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => action.action(item)}
                            className="px-3 py-1 text-black bg-white border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
                          >
                            {action.label}
                          </button>
                        ))}

                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="px-3 py-1 text-white bg-blue-500 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="px-3 py-1 text-white bg-red-500 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
