import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { BackofficeModule } from "@/backoffice/core/builders/BackofficeRegistry";
import { BackofficeHeader } from "./BackofficeHeader";
import { DetailView } from "./DetailView";

interface DetailPageProps {
  module: BackofficeModule;
  id: string;
}

export const DetailPage: React.FC<DetailPageProps> = ({ module, id }) => {
  const router = useRouter();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [relatedEntities, setRelatedEntities] = useState<Record<string, any[]>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await module.fetchItem(id);
      setData(response.data || response);

      if (module.detailConfig?.relatedEntities) {
        const relatedData: Record<string, any[]> = {};

        for (const relatedEntity of module.detailConfig.relatedEntities) {
          try {
            // This is a simplification, in a real app you'd have a proper API for this
            const response = await fetch(
              `/api/${relatedEntity.entity}?${relatedEntity.relationField}=${id}`
            );
            const data = await response.json();
            relatedData[relatedEntity.entity] = data.data || data;
          } catch (err) {
            console.error(
              `Error fetching related entity ${relatedEntity.entity}:`,
              err
            );
          }
        }

        setRelatedEntities(relatedData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(module.getEditPath(id));
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete this ${module.config.title.toLowerCase()}?`
      )
    ) {
      try {
        await module.deleteItem(id);
        router.push(module.getListPath());
      } catch (err) {
        console.error("Error deleting item:", err);
        setError("Failed to delete item. Please try again later.");
      }
    }
  };

  const handleBack = () => {
    router.push(module.getListPath());
  };

  const renderActions = () => (
    <div className="flex space-x-3">
      <button
        onClick={handleBack}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-bold rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        Back
      </button>
      <button
        onClick={handleEdit}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        Delete
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="p-6 bg-red-100 border-4 border-black text-red-700 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-bold text-lg mb-4">{error}</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-bold border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          Back to List
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  const itemTitle = data?.name || data?.title || id;

  return (
    <div>
      <BackofficeHeader
        title={`${module.config.title.slice(0, -1)} Details`}
        subtitle={itemTitle}
        hasCreateButton={false}
      />

      <div className="mb-4">{renderActions()}</div>

      <DetailView
        data={data || {}}
        config={module.detailConfig || { sections: [] }}
        relatedEntities={relatedEntities}
      />
    </div>
  );
};
