import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/utils/cn";
import { Search, X, Plus, Minus } from "lucide-react";
import { useOutsideClick } from "@/hooks/useOutsideClick";

export interface Option {
  value: string;
  label: string;
  id?: string;
  name?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  [key: string]: any; // Allow additional properties
}

interface MultiSelectAutocompleteProps {
  values: Option[];
  onChange: (values: Option[]) => void;
  placeholder?: string;
  label: string;
  queryKey: string;
  fetchOptions: (search: string) => Promise<Option[]>;
  error?: string;
  required?: boolean;
  maxItems?: number;
  allowQuantityChange?: boolean;
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

export const MultiSelectAutocomplete: React.FC<
  MultiSelectAutocompleteProps
> = ({
  values = [],
  onChange,
  placeholder,
  label,
  queryKey,
  fetchOptions,
  error,
  required,
  maxItems,
  allowQuantityChange = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

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

  // Filter out options that are already selected
  const availableOptions = options.filter(
    (option) => !values.some((item) => item.value === option.value)
  );

  const handleSelect = (option: Option) => {
    if (maxItems && values.length >= maxItems) {
      return; // Don't add more items if max is reached
    }

    // Add quantity property if it doesn't exist
    const newOption = {
      ...option,
      quantity: option.quantity || 1,
    };

    onChange([...values, newOption]);
    setSearch("");

    // Keep dropdown open for multiple selections
    if (!maxItems || values.length + 1 < maxItems) {
      // Focus the input again
      const input = containerRef.current?.querySelector("input");
      if (input) {
        input.focus();
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(values.filter((item) => item.value !== optionValue));
  };

  const handleQuantityChange = (optionValue: string, delta: number) => {
    const newValues = values.map((item) => {
      if (item.value === optionValue) {
        const newQuantity = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    onChange(newValues);
  };

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block mb-2 font-bold">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div
          className={cn(
            "w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
            error && "border-red-500",
            isOpen && "ring-2 ring-black ring-offset-2"
          )}
          onClick={() => setIsOpen(true)}
        >
          {/* Selected items */}
          {values.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {values.map((item) => (
                <div
                  key={item.value}
                  className="flex items-center bg-gray-100 border border-gray-300 rounded px-2 py-1"
                >
                  <span className="text-sm">{item.label}</span>

                  {allowQuantityChange && (
                    <div className="flex items-center ml-2 border-l pl-2">
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.value, -1);
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="mx-1 text-xs font-medium">
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.value, 1);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="ml-2 text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.value);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input field */}
          {isOpen ? (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                values.length === 0
                  ? placeholder || `Search ${label.toLowerCase()}...`
                  : "Add more..."
              }
              className="w-full bg-transparent border-none outline-none p-0 focus:ring-0"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between">
              {values.length === 0 && (
                <span className="text-gray-500">
                  {placeholder || `Select ${label.toLowerCase()}...`}
                </span>
              )}
              <Search className="h-4 w-4 text-gray-500 ml-auto" />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-2 text-center text-gray-500">Loading...</div>
            ) : availableOptions.length === 0 ? (
              <div className="p-2 text-center text-gray-500">
                {options.length === 0
                  ? "No results found"
                  : "All items already selected"}
              </div>
            ) : (
              <ul>
                {availableOptions.map((option) => (
                  <li
                    key={option.value}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
