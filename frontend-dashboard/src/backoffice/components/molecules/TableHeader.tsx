import TableSortIndicator from "../atoms/TableSortIndicator";

interface TableHeaderProps {
  field: string;
  header: string;
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

const TableHeader = ({
  field,
  header,
  sortField,
  sortDirection,
  onSort,
}: TableHeaderProps) => {
  return (
    <th
      className="p-4 text-left font-bold cursor-pointer"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {header}
        <TableSortIndicator
          active={sortField === field}
          direction={sortDirection}
        />
      </div>
    </th>
  );
};

export default TableHeader;
