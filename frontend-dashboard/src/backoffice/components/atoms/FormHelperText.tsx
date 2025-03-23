import React from "react";
import { cn } from "@/utils/cn";

interface FormHelperTextProps {
  children?: React.ReactNode;
  className?: string;
}

export const FormHelperText = ({
  children,
  className,
}: FormHelperTextProps) => {
  if (!children) return null;

  return (
    <p className={cn("mt-2 text-sm text-neutral-600", className)}>{children}</p>
  );
};
