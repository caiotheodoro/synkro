import React from "react";

interface TableCellProps {
  value: any;
  render?: (value: any, item: any) => React.ReactNode;
  item: any;
}

const TableCell = ({ value, render, item }: TableCellProps) => {
  return (
    <td className="p-4 whitespace-nowrap">
      {render ? render(value, item) : value}
    </td>
  );
};

export default TableCell;
