import React from "react";

export interface AttributesDisplayProps {
  attributes: Record<string, string> | null | undefined;
}

export const AttributesDisplay: React.FC<AttributesDisplayProps> = ({
  attributes,
}) => {
  if (!attributes || Object.keys(attributes).length === 0) {
    return <div className="text-gray-500 italic">No attributes defined</div>;
  }

  return (
    <div className="space-y-1">
      {Object.entries(attributes).map(([key, value], index) => (
        <div key={index} className="flex">
          <span className="font-medium mr-2">{key}:</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
};

// For list view - displays attributes in a compact format
export const AttributesBadges: React.FC<AttributesDisplayProps> = ({
  attributes,
}) => {
  if (!attributes || Object.keys(attributes).length === 0) {
    return <span className="text-gray-500 italic">None</span>;
  }

  const entries = Object.entries(attributes);

  return (
    <div className="max-w-xs truncate">
      {entries.slice(0, 2).map(([key, value]) => (
        <span
          key={key}
          className="inline-block mr-1 px-2 py-1 bg-gray-100 text-xs rounded-full"
        >
          {key}: {value}
        </span>
      ))}
      {entries.length > 2 && (
        <span className="text-xs text-gray-500">
          +{entries.length - 2} more
        </span>
      )}
    </div>
  );
};

export default AttributesDisplay;
