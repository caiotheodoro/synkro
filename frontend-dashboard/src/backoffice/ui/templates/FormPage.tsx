import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import { ChevronLeftIcon } from "lucide-react";
import { ApiService } from "@/services/api.service";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { FieldConfig } from "@/components/forms/types";

interface FormSection {
  title: string;
  fields: string[];
}

interface FormPageProps {
  title: string;
  apiEndpoint: string;
  fields: FieldConfig[];
  sections?: FormSection[];
  isNew?: boolean;
}

export const FormPage: React.FC<FormPageProps> = ({
  title,
  apiEndpoint,
  fields,
  sections,
  isNew = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Create API service instance
  const apiService = new ApiService({
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3001",
    timeout: 10000,
  });

  // Fetch item data if editing existing item
  const {
    data: itemData,
    isLoading,
    isError,
    error,
  } = useQuery(
    [`${apiEndpoint}/${id}`, id],
    async () => {
      if (isNew || !id) return null;
      const response = await apiService.get(`${apiEndpoint}/${id}`);
      return response.data;
    },
    {
      enabled: !isNew && !!id,
      staleTime: 30000,
    }
  );

  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      if (isNew) {
        await apiService.post(apiEndpoint, formData);
      } else {
        await apiService.put(`${apiEndpoint}/${id}`, formData);
      }

      // Invalidate queries to refresh list data
      queryClient.invalidateQueries(apiEndpoint);

      // Navigate back to list
      const listPath = apiEndpoint.replace("/api", "/backoffice");
      navigate(listPath);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    const listPath = apiEndpoint.replace("/api", "/backoffice");
    navigate(listPath);
  };

  // Split fields into sections if sections are provided
  const getFieldsForSection = (sectionFields: string[]) => {
    return fields.filter((field) => sectionFields.includes(field.name));
  };

  // If no sections provided, all fields are in a single form
  const fieldsBySection = sections
    ? sections.map((section) => ({
        title: section.title,
        fields: getFieldsForSection(section.fields),
      }))
    : [{ title: "", fields }];

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
        Error loading data: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={handleCancel}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <div className="bg-white rounded-md shadow p-6 space-y-8">
        {fieldsBySection.map((section, index) => (
          <div key={index} className="space-y-4">
            {section.title && (
              <h2 className="text-lg font-medium border-b pb-2">
                {section.title}
              </h2>
            )}

            <DynamicForm
              fields={section.fields}
              initialData={itemData}
              onSubmit={
                index === fieldsBySection.length - 1 ? handleSubmit : undefined
              }
              submitLabel={isNew ? "Create" : "Update"}
              showSubmitButton={index === fieldsBySection.length - 1}
              queryInvalidations={[apiEndpoint]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
