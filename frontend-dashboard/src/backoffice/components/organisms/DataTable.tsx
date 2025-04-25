import React, { useState } from "react";
import { BackofficeListConfig } from "@/backoffice/core/builders/BackofficeBuilder";
import TableCell from "../atoms/TableCell";
import TableRow from "../molecules/TableRow";
import TableHeader from "../molecules/TableHeader";
import TableActionButton from "../atoms/TableActionButton";

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
    return column.render ? column.render(value, item) : value;
  };

  const hasActions =
    onEdit || onDelete || (config.actions && config.actions.length > 0);
  const hasBulkActions =
    config.bulkActions &&
    config.bulkActions.length > 0 &&
    selectedItems.length > 0;

  return (
    <div className="overflow-hidden rounded-lg border-3 border-black shadow-neo bg-white">
      <div className="border-b-3 border-black">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-bold">Results ({data.length})</h3>

          {hasBulkActions && (
            <div className="flex space-x-2">
              {config?.bulkActions?.map((action, index) => (
                <TableActionButton
                  key={index}
                  label={action.label}
                  onClick={() => action.action(selectedItems)}
                  variant="primary"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black">
          <thead className="bg-gray-50 border-b-3 border-black">
            <tr>
              {config.bulkActions && config.bulkActions.length > 0 && (
                <TableCell align="center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-2 border-black rounded"
                    checked={
                      selectedItems.length === data.length && data.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}

              {config.columns.map((column, index) => (
                <TableHeader
                  key={index}
                  field={column.field}
                  header={column.header}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              ))}

              {hasActions && <TableCell align="right">Actions</TableCell>}
            </tr>
          </thead>

          <tbody className="divide-y divide-black">
            {sortedData.length === 0 ? (
              <tr>
                <TableCell
                  align="center"
                  colSpan={
                    config.columns.length +
                    (hasActions ? 1 : 0) +
                    (config.bulkActions ? 1 : 0)
                  }
                >
                  No data found
                </TableCell>
              </tr>
            ) : (
              sortedData.map((item, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  isSelected={selectedItems.some((i) => i.id === item.id)}
                  onSelect={() =>
                    handleSelectItem(
                      item,
                      !selectedItems.some((i) => i.id === item.id)
                    )
                  }
                >
                  {config.columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {renderCell(item, column)}
                    </TableCell>
                  ))}

                  {hasActions && (
                    <TableCell align="right">
                      <div className="flex justify-end space-x-2">
                        {config.actions?.map((action, actionIndex) => (
                          <TableActionButton
                            key={actionIndex}
                            label={action.label}
                            onClick={() => action.action(item)}
                          />
                        ))}
                        {onEdit && (
                          <TableActionButton
                            label="Edit"
                            onClick={() => onEdit(item)}
                            variant="primary"
                          />
                        )}
                        {onDelete && (
                          <TableActionButton
                            label="Delete"
                            onClick={() => onDelete(item)}
                            variant="danger"
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
