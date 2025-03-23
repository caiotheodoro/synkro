import React from "react";
import { cn } from "@/utils/cn";

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("block mb-2 font-bold", className)}
        {...props}
      >
        {children}
        {required && <span className="text-red-500">*</span>}
      </label>
    );
  }
);

FormLabel.displayName = "FormLabel";
