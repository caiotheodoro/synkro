import React from "react";
import { cn } from "@/utils/cn";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(({ className, rows = 5, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
        className
      )}
      rows={rows}
      ref={ref}
      {...props}
    />
  );
});

FormTextarea.displayName = "FormTextarea";
