import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";

export interface BackofficeConfig {
  title: string;
  basePath: string;
  icon?: ReactNode;
  permissions?: string[];
}

export interface BackofficeListConfig {
  columns: Array<{
    field: string;
    header: string;
    render?: (value: any, item: any) => ReactNode;
  }>;
  searchFields?: string[];
  filters?: Array<{
    field: string;
    label: string;
    type: "select" | "text" | "date" | "number" | "boolean";
    options?: Array<{ value: string; label: string }>;
  }>;
  actions?: Array<{
    label: string;
    icon?: ReactNode;
    action: (item: any) => void;
    permission?: string;
  }>;
  bulkActions?: Array<{
    label: string;
    icon?: ReactNode;
    action: (items: any[]) => void;
    permission?: string;
  }>;
}

export interface BackofficeFormField {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "boolean"
    | "date"
    | "file"
    | "custom"
    | "autocomplete";
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  hidden?: boolean;
  validation?: (value: any) => string | undefined;
  options?: Array<{ value: string; label: string }>;
  component?: (props: {
    value: any;
    onChange: (value: any) => void;
  }) => ReactNode;
}

export interface BackofficeFormConfig {
  fields: Array<BackofficeFormField>;
  sections?: Array<{
    title: string;
    fields: string[];
    collapsed?: boolean;
  }>;
  layout?: "default" | "two-column" | "tabs";
}

export interface BackofficeDetailConfig {
  sections: Array<{
    title: string;
    fields: Array<{
      label: string;
      field: string;
      render?: (value: any, item: any) => ReactNode;
    }>;
  }>;
  actions?: Array<{
    label: string;
    icon?: ReactNode;
    action: (item: any) => void;
    permission?: string;
  }>;
  relatedEntities?: Array<{
    title: string;
    entity: string;
    relationField: string;
    display: (item: any) => ReactNode;
  }>;
}

interface NavItem {
  label: string;
  href: string;
  icon:
    | React.ReactNode
    | ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
      >;
}
export interface BackofficeBuilder {
  setConfig(config: BackofficeConfig): BackofficeBuilder;
  setListConfig(config: BackofficeListConfig): BackofficeBuilder;
  setFormConfig(config: BackofficeFormConfig): BackofficeBuilder;
  setDetailConfig(config: BackofficeDetailConfig): BackofficeBuilder;
  setApiEndpoint(endpoint: string): BackofficeBuilder;
  setNavItem(item: NavItem): BackofficeBuilder;
  build(): any;
}
