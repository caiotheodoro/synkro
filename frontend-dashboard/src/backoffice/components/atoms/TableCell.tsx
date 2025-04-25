import React from "react";

interface TableCellProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  colSpan?: number;
}

const TableCell = ({ children, align = "left", colSpan }: TableCellProps) => {
  return (
    <td
      className={`
        px-6 py-4 text-sm font-medium text-gray-900
        border-b-2 border-black
        ${
          align === "left"
            ? "text-left"
            : align === "center"
            ? "text-center"
            : "text-right"
        }
      `}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

export default TableCell;
