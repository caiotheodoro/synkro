import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { ApiService } from "@/services/api.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export interface Column {
  field: string;
  header: string;
}

interface ListPageProps {
  title: string;
  apiEndpoint: string;
  columns: Column[];
  searchFields?: string[];
}

export const ListPage: React.FC<ListPageProps> = ({
  title,
  apiEndpoint,
  columns,
  searchFields = [],
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Create API service instance
  const apiService = new ApiService({
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3001",
    timeout: 10000,
  });

  // Fetch data with React Query
  const { data, isLoading, isError, error } = useQuery(
    [apiEndpoint, page, searchTerm],
    async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await apiService.get(
        `${apiEndpoint}?${params.toString()}`
      );
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  );

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Handle row click
  const handleRowClick = (id: string | number) => {
    navigate(`${apiEndpoint.replace("/api", "/backoffice")}/${id}`);
  };

  // Invalidate queries when component mounts to ensure data freshness
  React.useEffect(() => {
    queryClient.invalidateQueries(apiEndpoint);
  }, [apiEndpoint, queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link to={`${apiEndpoint.replace("/api", "/backoffice")}/new`}>
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            <span>Add New</span>
          </Button>
        </Link>
      </div>

      {searchFields.length > 0 && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
          Error loading data: {(error as Error).message}
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.field}
                      className="px-4 py-3 text-left font-medium"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.items?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(item.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleRowClick(item.id);
                      }
                    }}
                  >
                    {columns.map((column) => (
                      <td key={column.field} className="px-4 py-3">
                        {renderCellValue(item[column.field])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, data.totalItems)} of{" "}
                  {data.totalItems} items
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={page === data.totalPages}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Helper function to render cell values
const renderCellValue = (value: any): React.ReactNode => {
  if (value === undefined || value === null) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return value.toString();
};
