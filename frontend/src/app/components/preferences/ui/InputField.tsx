import React, { forwardRef } from "react";
import { RequiredLabel } from "./RequiredLabel";
import { ErrorMessage } from "./ErrorMessage";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    { label, required = false, tooltip, error, className = "", ...props },
    ref
  ) => (
    <div className="space-y-1">
      <RequiredLabel required={required} tooltip={tooltip}>
        {label}
      </RequiredLabel>
      <input
        ref={ref}
        className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white ${
          error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""
        } ${className}`}
        {...props}
      />
      <ErrorMessage error={error} />
    </div>
  )
);

InputField.displayName = "InputField";
