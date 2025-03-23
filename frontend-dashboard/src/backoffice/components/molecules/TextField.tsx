import React from "react";
import { FormField, FormFieldProps } from "./FormField";
import { FormInput, FormInputProps } from "../atoms/FormInput";

export interface TextFieldProps extends Omit<FormFieldProps, "children"> {
  type?: "text" | "email" | "password" | "date";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputProps?: Omit<
    FormInputProps,
    "name" | "id" | "value" | "onChange" | "placeholder" | "type"
  >;
}

export const TextField = ({
  name,
  label,
  required,
  error,
  touched,
  helperText,
  value,
  onChange,
  placeholder,
  type = "text",
  inputProps,
}: TextFieldProps) => {
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
        type={type}
        {...inputProps}
      />
    </FormField>
  );
};
