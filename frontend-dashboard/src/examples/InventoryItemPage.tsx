import React from "react";
import { useRouter } from "next/router";
import InventoryItemForm from "./InventoryItemForm";
import { useQuery } from "@tanstack/react-query";
import { ApiService } from "../services/api.service";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface InventoryItemPageProps {
  id?: string;
}

const InventoryItemPage: React.FC<InventoryItemPageProps> = ({ id }) => {
  const router = useRouter();
  const isEditMode = !!id;

  const { data: itemData, isLoading } = useQuery<Record<string, any>>({
    queryKey: ["inventory", id],
    queryFn: () => apiService.get(`/api/inventory/${id}`),
    enabled: isEditMode,
    staleTime: 30000,
  });

  const handleSuccess = () => {
    router.push("/inventory");
  };

  const handleCancel = () => {
    router.push("/inventory");
  };

  if (isEditMode && isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Inventory Item" : "Add Inventory Item"}
      </h1>

      <InventoryItemForm
        initialData={itemData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default InventoryItemPage;
