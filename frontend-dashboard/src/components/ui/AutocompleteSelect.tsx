import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/utils/cn";
import { Search } from "lucide-react";
import { useOutsideClick } from "@/hooks/useOutsideClick";

interface Option {
  value: string;
  label: string;
}

interface AutocompleteSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  queryKey: string;
  fetchOptions: (search: string) => Promise<Option[]>;
  error?: string;
  required?: boolean;
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  value,
  onChange,
  placeholder,
  label,
  queryKey,
  fetchOptions,
  error,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedLabel, setSelectedLabel] = useState("");

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearch("");
  }, []);

  const containerRef = useOutsideClick<HTMLDivElement>(handleClose);

  const { data: options = [], isLoading } = useQuery({
    queryKey: [queryKey, debouncedSearch],
    queryFn: () => fetchOptions(debouncedSearch),
    staleTime: 30000,
  });

  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find((opt) => opt.value === value);
      if (option) {
        setSelectedLabel(option.label);
      }
    }
  }, [value, options]);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setSelectedLabel(option.label);
    setIsOpen(false);
    setSearch("");
  };

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      toggleDropdown();
    }
  };

  const displayLabel = (selectedLabel || placeholder) ?? `Select ${label}...`;

  const renderOptions = () => {
    if (isLoading) {
      return <div className="p-2 text-center text-gray-500">Loading...</div>;
    }
    if (options.length === 0) {
      return (
        <div className="p-2 text-center text-gray-500">No results found</div>
      );
    }
    return (
      <ul>
        {options.map((option) => (
          <li
            key={option.value}
            className={cn(
              "px-3 py-2 cursor-pointer hover:bg-gray-100",
              option.value === value && "bg-gray-100 font-medium"
            )}
            onClick={() => handleSelect(option)}
            role="option"
            aria-selected={option.value === value}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSelect(option);
              }
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={cn(
          "w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
          error && "border-red-500",
          isOpen && "ring-2 ring-black ring-offset-2"
        )}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <span className={selectedLabel ? "text-black" : "text-gray-500"}>
            {displayLabel}
          </span>
          <Search className="h-4 w-4 text-gray-500" />
        </div>
        {isOpen && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full bg-transparent border-none outline-none p-0 focus:ring-0"
            autoFocus
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-60 overflow-auto">
          {renderOptions()}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
