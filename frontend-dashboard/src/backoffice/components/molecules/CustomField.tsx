import React from "react";
import { FormField, FormFieldProps } from "./FormField";

export interface CustomFieldProps extends Omit<FormFieldProps, "children"> {
  component: React.ReactElement;
}

export const CustomField = ({
  name,
  label,
  required,
  error,
  touched,
  helperText,
  component,
}: CustomFieldProps) => {
  return (
    <FormField
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
      helperText={helperText}
    >
      {component}
    </FormField>
  );
};
