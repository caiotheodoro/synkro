import React from "react";
import { FormLabel } from "../atoms/FormLabel";
import { FormError } from "../atoms/FormError";
import { FormHelperText } from "../atoms/FormHelperText";

export interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  helperText?: string;
  children: React.ReactNode;
}

export const FormField = ({
  name,
  label,
  required,
  error,
  touched,
  helperText,
  children,
}: FormFieldProps) => {
  const showError = touched && error;

  return (
    <div className="mb-4">
      <FormLabel htmlFor={name} required={required}>
        {label}
      </FormLabel>
      {children}
      <FormError>{showError ? error : null}</FormError>
      {helperText && !showError && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </div>
  );
};
