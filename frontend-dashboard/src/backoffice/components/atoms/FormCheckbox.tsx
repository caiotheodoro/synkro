import React from "react";
import { cn } from "@/utils/cn";

export interface FormCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const FormCheckbox = React.forwardRef<
  HTMLInputElement,
  FormCheckboxProps
>(({ className, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      className={cn(
        "w-5 h-5 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

FormCheckbox.displayName = "FormCheckbox";
