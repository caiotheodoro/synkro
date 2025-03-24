import { SelectOption } from "../components/atoms/FormSelect";
import { LucideIcon } from "lucide-react";

export interface FormComponentProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "password"
    | "email"
    | "date"
    | "boolean"
    | "custom";
  helperText?: string;
  options?: SelectOption[];
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
}

export interface FormFieldConfig
  extends Omit<FormComponentProps, "onChange" | "onBlur" | "value" | "error"> {
  validation?: (value: any) => string | undefined;
}

export interface FormSectionConfig {
  title: string;
  fields: FormFieldConfig[];
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

// Base configuration
export interface BackofficeConfig {
  title: string;
  basePath: string;
  permissions?: string[];
}

// List view configuration
export interface BackofficeListConfig {
  columns: Array<{
    field: string;
    header: string;
  }>;
  searchFields?: string[];
  filters?: Array<{
    field: string;
    label: string;
    type: "select" | "checkbox" | "date" | "daterange";
    options?: Array<{ value: string; label: string }>;
  }>;
  defaultSort?: {
    field: string;
    direction: "asc" | "desc";
  };
  rowActions?: Array<{
    label: string;
    action: string;
    icon?: LucideIcon;
  }>;
  bulkActions?: Array<{
    label: string;
    action: string;
    icon?: LucideIcon;
  }>;
}

// Form field validation function type
export type ValidationFunction = (value: any) => string | undefined;

// Backoffice form field configuration (separate from existing FormFieldConfig)
export interface BackofficeFormFieldConfig {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "multiselect"
    | "checkbox"
    | "radio"
    | "date"
    | "datetime"
    | "file"
    | "password"
    | "email"
    | "tel"
    | "url"
    | "color"
    | "boolean";
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  multiple?: boolean;
  accept?: string; // For file inputs
  rows?: number; // For textarea
  cols?: number; // For textarea
  pattern?: string; // Regex pattern for validation
  validation?: ValidationFunction;
  dependencies?: string[]; // Field names that this field depends on
  component?: (props: {
    value: any;
    onChange: (value: any) => void;
  }) => React.ReactElement;
}

// Form configuration
export interface BackofficeFormConfig {
  fields: BackofficeFormFieldConfig[];
  sections?: Array<{
    title: string;
    fields: string[];
  }>;
  submitLabel?: string;
  cancelLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
}

// Detail view configuration
export interface BackofficeDetailConfig {
  fields: Array<{
    field: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
  }>;
  sections?: Array<{
    title: string;
    fields: string[];
  }>;
  actions?: Array<{
    label: string;
    action: string;
    icon?: LucideIcon;
    permission?: string;
  }>;
}
