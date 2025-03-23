import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BackofficeFormConfig } from "../core/types";

export interface UseFormActionsProps {
  config: BackofficeFormConfig;
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  queryInvalidations?: string[];
}

export const useFormActions = ({
  config,
  initialValues,
  onSubmit,
  queryInvalidations = [],
}: UseFormActionsProps) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const validateField = (name: string, value: any) => {
    const field = config.fields.find((f) => f.name === name);

    if (!field) return undefined;

    if (
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return undefined;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    config.fields.forEach((field) => {
      // Only validate hidden fields if they're required
      if (field.hidden && !field.required) {
        return;
      }

      const error = validateField(field.name, values[field.name]);

      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    let newValue: any = value;

    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      newValue = value === "" ? "" : Number(value);
    }

    setValues({
      ...values,
      [name]: newValue,
    });

    setTouched({
      ...touched,
      [name]: true,
    });

    const error = validateField(name, newValue);

    setErrors({
      ...errors,
      [name]: error ?? "",
    });
  };

  const handleValueChange = (name: string, value: any) => {
    setValues({
      ...values,
      [name]: value,
    });

    setTouched({
      ...touched,
      [name]: true,
    });

    const error = validateField(name, value);

    setErrors({
      ...errors,
      [name]: error ?? "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched: Record<string, boolean> = {};
    config.fields.forEach((field) => {
      allTouched[field.name] = true;
    });

    setTouched(allTouched);

    if (validateForm()) {
      // Process date fields to ensure they're properly formatted
      const processedValues = { ...values };

      config.fields.forEach((field) => {
        if (field.type === "date" && processedValues[field.name]) {
          // Convert date objects to ISO strings if they aren't already
          if (processedValues[field.name] instanceof Date) {
            processedValues[field.name] =
              processedValues[field.name].toISOString();
          } else if (
            typeof processedValues[field.name] === "string" &&
            !processedValues[field.name].includes("T")
          ) {
            // If it's a date string without time component (YYYY-MM-DD), add time
            processedValues[field.name] = new Date(
              `${processedValues[field.name]}T00:00:00Z`
            ).toISOString();
          }
        }
      });

      onSubmit(processedValues);

      // Invalidate queries after form submission
      if (queryInvalidations.length > 0) {
        queryInvalidations.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleValueChange,
    handleSubmit,
    validateField,
    validateForm,
    reset,
  };
};
