import React from "react";
import { Button } from "@/components/ui/Button";

interface FormActionsProps {
  onCancel?: () => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
}

export const FormActions = ({
  onCancel,
  isLoading = false,
  saveText = "Save",
  cancelText = "Cancel",
}: FormActionsProps) => {
  return (
    <div className="mt-6 flex justify-end space-x-4 gap-2">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-white text-black font-bold rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          disabled={isLoading}
        >
          {cancelText}
        </button>
      )}

      <Button
        type="submit"
        variant="primary"
        className="px-6 py-3"
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isLoading ? "Saving..." : saveText}
      </Button>
    </div>
  );
};
