import React, { useState } from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  field: string;
  label: string;
  type: 'select' | 'text' | 'number' | 'date';
  options?: FilterOption[];
}

interface SearchAndFilterProps {
  onSearch: (searchTerm: string) => void;
  filters?: FilterConfig[];
  onFilterChange?: (field: string, value: any) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearch,
  filters = [],
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleFilterChange = (field: string, value: any) => {
    const newFilters = {
      ...activeFilters,
      [field]: value
    };
    
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(field, value);
    }
  };

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
                  id={filter.field}
                  className="block w-full border-2 border-black rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black"
                  value={activeFilters[filter.field] || ''}
                  onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            >
              <option value="">All</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
                </select>
        );
      case 'date':
        return (
          <input
          type="date"
          id={filter.field}
          className="block w-full border-2 border-black rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black"
          value={activeFilters[filter.field] || ''}
          onChange={(e) => handleFilterChange(filter.field, e.target.value)}
        />
        );
      case 'number':
        return (
          <div key={filter.field}>
            <label htmlFor={filter.field}>{filter.label}</label>
            <input
              type="number"
              id={filter.field}
              value={activeFilters[filter.field] || ''}
              onChange={(e) => handleFilterChange(filter.field, e.target.valueAsNumber || null)}
              className="block w-full border-2 border-black rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        );
      default:
        return (
          <input
          type="text"
          id={filter.field}
          className="block w-full border-2 border-black rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black"
          value={activeFilters[filter.field] || ''}
          onChange={(e) => handleFilterChange(filter.field, e.target.value)}
        />
        );
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex w-full space-x-2">
        <div className="relative flex-grow ">
          <input
            type="text"
            className=" py-2 pr-4 w-full border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-black px-3"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      
      </form>

      {filters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {filters.map((filter) => (
            <div key={filter.field} className="space-y-1">
              <label className="block text-sm font-medium" htmlFor={filter.field}>
                {filter.label}
              </label>
              
              {renderFilter(filter)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 