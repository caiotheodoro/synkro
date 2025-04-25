import React from "react";

interface TableCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

const TableCheckbox = ({ checked, onChange }: TableCheckboxProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={onChange}
      className={`
        w-5 h-5 rounded border-2 cursor-pointer
        transition-colors duration-200 ease-in-out
        hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
        ${checked ? "bg-blue-500 border-blue-500" : "border-gray-300"}
      `}
    >
      {checked && (
        <svg
          className="w-3 h-3 mx-auto mt-0.5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
};

export default TableCheckbox;
