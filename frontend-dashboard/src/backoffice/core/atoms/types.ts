import { ReactNode } from "react";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

// Basic types
export interface NavItem {
  label: string;
  href: string;
  icon:
    | ReactNode
    | ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
      >;
}

export interface SelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

export interface FormComponentProps {
  value: any;
  onChange: (value: any) => void;
}

// Entity interfaces
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  [key: string]: any;
}

export interface Customer {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Warehouse {
  id: string;
  name: string;
  [key: string]: any;
}

export interface OrderItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  [key: string]: any;
}

export interface ProductCategory {
  id: string;
  name: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T[];
  [key: string]: any;
}
