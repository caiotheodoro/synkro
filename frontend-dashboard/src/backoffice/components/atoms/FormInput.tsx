import React from "react";
import { cn } from "@/utils/cn";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

FormInput.displayName = "FormInput";
