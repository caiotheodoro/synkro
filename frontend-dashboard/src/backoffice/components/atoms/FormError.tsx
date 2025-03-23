import React from "react";
import { cn } from "@/utils/cn";

interface FormErrorProps {
  children?: React.ReactNode;
  className?: string;
}

export const FormError = ({ children, className }: FormErrorProps) => {
  if (!children) return null;

  return (
    <p className={cn("mt-2 text-sm text-red-500 font-medium", className)}>
      {children}
    </p>
  );
};
