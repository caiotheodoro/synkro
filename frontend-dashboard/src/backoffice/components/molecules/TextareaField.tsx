import React from "react";
import { FormField, FormFieldProps } from "./FormField";
import { FormTextarea, FormTextareaProps } from "../atoms/FormTextarea";

export interface TextareaFieldProps extends Omit<FormFieldProps, "children"> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  textareaProps?: Omit<
    FormTextareaProps,
    "name" | "id" | "value" | "onChange" | "placeholder" | "rows"
  >;
}

export const TextareaField = ({
  name,
  label,
  required,
  error,
  touched,
  helperText,
  value,
  onChange,
  placeholder,
  rows = 5,
  textareaProps,
}: TextareaFieldProps) => {
  return (
    <FormField
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
      helperText={helperText}
    >
      <FormTextarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        {...textareaProps}
      />
    </FormField>
  );
};
