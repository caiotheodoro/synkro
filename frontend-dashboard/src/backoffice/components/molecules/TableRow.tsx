import React from "react";
import TableCheckbox from "../atoms/TableCheckbox";
import TableCell from "../atoms/TableCell";

interface TableRowProps {
  isSelected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  isHeader?: boolean;
}

const TableRow = ({
  isSelected,
  onSelect,
  children,
  isHeader = false,
}: TableRowProps) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <tr
      className={`
        transition-colors duration-200 ease-in-out
        hover:bg-gray-50 cursor-pointer
        ${isSelected ? "bg-gray-100" : "bg-white"}
        ${isHeader ? "bg-gray-100 hover:bg-gray-100" : ""}
      `}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="row"
      tabIndex={0}
      aria-selected={isSelected}
    >
      <TableCell>
        <TableCheckbox checked={isSelected} onChange={onSelect} />
      </TableCell>
      {children}
    </tr>
  );
};

export default TableRow;
