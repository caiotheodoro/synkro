import React from "react";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FormSection = ({ title, children }: FormSectionProps) => {
  return (
    <div className="mb-6">
      <h3 className="mb-4 text-xl font-bold border-b-4 border-black pb-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4">{children}</div>
    </div>
  );
};
