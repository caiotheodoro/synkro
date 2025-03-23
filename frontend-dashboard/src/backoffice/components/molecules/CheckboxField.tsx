import React from "react";
import { FormCheckbox, FormCheckboxProps } from "../atoms/FormCheckbox";
import { FormError } from "../atoms/FormError";
import { FormHelperText } from "../atoms/FormHelperText";

export interface CheckboxFieldProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  helperText?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  checkboxProps?: Omit<
    FormCheckboxProps,
    "name" | "id" | "checked" | "onChange"
  >;
}

export const CheckboxField = ({
  name,
  label,
  required,
  error,
  touched,
  helperText,
  checked,
  onChange,
  checkboxProps,
}: CheckboxFieldProps) => {
  const showError = touched && error;

  return (
    <div className="mb-4">
      <div className="flex items-center">
        <FormCheckbox
          id={name}
          name={name}
          checked={checked}
          onChange={onChange}
          {...checkboxProps}
        />
        <label className="ml-3 font-bold" htmlFor={name}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <FormError>{showError ? error : null}</FormError>
      {helperText && !showError && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </div>
  );
};
