interface TableSortIndicatorProps {
  active: boolean;
  direction: "asc" | "desc";
}

const TableSortIndicator = ({ active, direction }: TableSortIndicatorProps) => {
  if (!active) return null;

  return <span className="ml-1">{direction === "asc" ? "↑" : "↓"}</span>;
};

export default TableSortIndicator;
