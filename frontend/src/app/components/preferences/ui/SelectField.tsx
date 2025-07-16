import React, { forwardRef } from "react";
import { RequiredLabel } from "./RequiredLabel";
import { ErrorMessage } from "./ErrorMessage";

interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  children: React.ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      required = false,
      tooltip,
      error,
      children,
      className = "",
      ...props
    },
    ref
  ) => (
    <div className="space-y-1">
      <RequiredLabel required={required} tooltip={tooltip}>
        {label}
      </RequiredLabel>
      <select
        ref={ref}
        className={`w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors ${
          error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      <ErrorMessage error={error} />
    </div>
  )
);

SelectField.displayName = "SelectField";
