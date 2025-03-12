import React, { useState, useEffect } from "react";

export interface Attribute {
  key: string;
  value: string;
}

export interface AttributesEditorProps {
  value: Record<string, string> | null | undefined;
  onChange: (value: Record<string, string>) => void;
}

export const AttributesEditor: React.FC<AttributesEditorProps> = ({
  value,
  onChange,
}) => {
  const [attributes, setAttributes] = useState<Array<Attribute>>(
    value ? Object.entries(value).map(([key, value]) => ({ key, value })) : []
  );

  useEffect(() => {
    if (value) {
      setAttributes(
        Object.entries(value).map(([key, value]) => ({ key, value }))
      );
    }
  }, [value]);

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = [...attributes];
    newAttributes.splice(index, 1);
    setAttributes(newAttributes);
    updateParentValue(newAttributes);
  };

  const handleAttributeChange = (
    index: number,
    field: "key" | "value",
    newValue: string
  ) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = newValue;
    setAttributes(newAttributes);
    updateParentValue(newAttributes);
  };

  const updateParentValue = (attrs: Array<Attribute>) => {
    const attributesObj = attrs.reduce((obj, { key, value }) => {
      if (key.trim()) {
        obj[key.trim()] = value;
      }
      return obj;
    }, {} as Record<string, string>);

    onChange(attributesObj);
  };

  const handleQuickFillAttributes = () => {
    const defaultAttributes = {
      brand: "",
      color: "",
      model: "",
      weight: "",
    };

    setAttributes(
      Object.entries(defaultAttributes).map(([key, value]) => ({ key, value }))
    );
    onChange(defaultAttributes);
  };

  return (
    <div className="space-y-4 p-4 border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Product Attributes</h3>
        <div className="space-x-2">
          <button
            type="button"
            onClick={handleQuickFillAttributes}
            className="px-3 py-2 bg-blue-500 text-white font-bold rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] transition-all"
          >
            Quick Fill
          </button>
          <button
            type="button"
            onClick={handleAddAttribute}
            className="px-3 py-2 bg-black text-white font-bold rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] transition-all"
          >
            Add Attribute
          </button>
        </div>
      </div>

      {attributes.length === 0 && (
        <div className="text-gray-500 italic">No attributes defined</div>
      )}

      {attributes.map((attr, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center"
        >
          <input
            type="text"
            value={attr.key}
            onChange={(e) =>
              handleAttributeChange(index, "key", e.target.value)
            }
            placeholder="Attribute (e.g. brand, color)"
            className="p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          />
          <input
            type="text"
            value={attr.value}
            onChange={(e) =>
              handleAttributeChange(index, "value", e.target.value)
            }
            placeholder="Value"
            className="p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          />
          <button
            type="button"
            onClick={() => handleRemoveAttribute(index)}
            className="p-2 bg-red-500 text-white font-bold rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] transition-all"
            aria-label="Remove attribute"
            tabIndex={0}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default AttributesEditor;
