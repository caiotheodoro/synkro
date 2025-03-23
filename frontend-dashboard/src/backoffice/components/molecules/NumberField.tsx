import React from "react";
import { FormField, FormFieldProps } from "./FormField";
import { FormInput, FormInputProps } from "../atoms/FormInput";

export interface NumberFieldProps extends Omit<FormFieldProps, "children"> {
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  inputProps?: Omit<
    FormInputProps,
    "name" | "id" | "value" | "onChange" | "placeholder" | "type"
  >;
}

export const NumberField = ({
  name,
  label,
  required,
  error,
  touched,
  helperText,
  value,
  onChange,
  placeholder,
  inputProps,
}: NumberFieldProps) => {
  return (
    <FormField
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
      helperText={helperText}
    >
      <FormInput
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type="number"
        {...inputProps}
      />
    </FormField>
  );
};
