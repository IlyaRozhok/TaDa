import React, { forwardRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
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
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasValue, setHasValue] = useState(() => {
      return !!(
        props.value ||
        props.defaultValue ||
        (typeof props.value === "string" && props.value.length > 0)
      );
    });

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    // Initialize component and update hasValue when props.value changes
    useEffect(() => {
      setHasValue(
        !!(
          props.value ||
          (typeof props.value === "string" && props.value.length > 0)
        )
      );
      // Mark as initialized after first render to enable animations
      if (!isInitialized) {
        setTimeout(() => setIsInitialized(true), 100);
      }
    }, [props.value, isInitialized]);

    return (
      <div className="relative">
        <div className="relative">
          <select
            ref={ref}
            {...props}
            className={`w-full px-6 pt-8 pb-4 pr-12 rounded-3xl focus:outline-none transition-all duration-200 bg-white appearance-none border-0 shadow-sm ${
              hasValue ? "text-gray-900" : "text-gray-400"
            } ${
              error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
            } ${className}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          >
            {children}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>

          {/* Floating label - hide when no value to show placeholder in select */}
          {hasValue && (
            <label
              className={`absolute left-6 pointer-events-none ${
                isInitialized ? "transition-all duration-200" : ""
              } top-3 text-xs text-gray-500`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
        </div>
        {tooltip && (
          <p className="text-xs text-gray-500 mt-1 px-6">{tooltip}</p>
        )}
        <ErrorMessage error={error} />
      </div>
    );
  }
);

SelectField.displayName = "SelectField";
