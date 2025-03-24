import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/services/api.service";
import { BackofficeFormConfig } from "@/backoffice/core/builders/BackofficeBuilder";
import { DynamicForm } from "@/backoffice/components";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface InventoryItemFormProps {
  initialData?: Record<string, any>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => {
      return initialData?.id
        ? apiService.put(`/api/inventory/${initialData.id}`, data)
        : apiService.post("/api/inventory", data);
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err: any) => {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to save inventory item";
      setError(errorMessage);
    },
  });

  const formConfig: BackofficeFormConfig = {
    fields: [
      {
        name: "name",
        label: "Product Name",
        type: "text",
        required: true,
      },
      {
        name: "sku",
        label: "SKU",
        type: "text",
        required: true,
        validation: (value) => {
          if (value && !/^[A-Z0-9-]+$/.test(value)) {
            return "SKU must contain only uppercase letters, numbers, and hyphens";
          }
          return undefined;
        },
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
      },
      {
        name: "price",
        label: "Price",
        type: "number",
        required: true,
      },
      {
        name: "stock",
        label: "Stock Level",
        type: "number",
        required: true,
      },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "electronics", label: "Electronics" },
          { value: "clothing", label: "Clothing" },
          { value: "books", label: "Books" },
          { value: "home", label: "Home & Kitchen" },
        ],
      },
      {
        name: "active",
        label: "Active",
        type: "boolean",
      },
    ],
    sections: [
      {
        title: "Basic Information",
        fields: ["name", "sku", "description"],
      },
      {
        title: "Inventory Details",
        fields: ["price", "stock", "category", "active"],
      },
    ],
  };

  const handleSubmit = (values: Record<string, any>) => {
    mutation.mutate(values);
  };

  return (
    <div className="p-6 bg-white border-3 border-black rounded-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-bold mb-6 border-b-4 border-black pb-2">
        {initialData ? "Edit Inventory Item" : "Add Inventory Item"}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-3 border-black text-red-700 rounded-md">
          {error}
        </div>
      )}

      <DynamicForm
        config={formConfig}
        initialValues={initialData || {}}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        isLoading={mutation.isPending}
        queryInvalidations={
          [
            "inventory",
            "inventoryOverview",
            initialData?.id ? `inventory-${initialData.id}` : null,
          ].filter(Boolean) as string[]
        }
      />
    </div>
  );
};

export default InventoryItemForm;
