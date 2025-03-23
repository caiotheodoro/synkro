import React from "react";
import { FormField, FormFieldProps } from "./FormField";
import { FormSelect, FormSelectProps, SelectOption } from "../atoms/FormSelect";

export interface SelectFieldProps extends Omit<FormFieldProps, "children"> {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  selectProps?: Omit<
    FormSelectProps,
    "name" | "id" | "value" | "onChange" | "options" | "placeholder"
  >;
}

export const SelectField = ({
  name,
  label,
  required,
  error,
  touched,
  helperText,
  value,
  onChange,
  options,
  placeholder,
  selectProps,
}: SelectFieldProps) => {
  return (
    <FormField
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
      helperText={helperText}
    >
      <FormSelect
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder || `Select ${label}`}
        {...selectProps}
      />
    </FormField>
  );
};
