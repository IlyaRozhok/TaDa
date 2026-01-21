import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  error?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  return (
    <div className="flex items-center gap-1 text-red-600 text-sm px-6">
      {error && (
        <>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </>
      )}
    </div>
  );
};
