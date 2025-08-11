import React, { forwardRef, useState, useEffect } from "react";
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

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <input
            ref={ref}
            {...props}
            className={`w-full px-6 pt-8 pb-4 rounded-full focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent peer ${
              error ? "border-red-400 focus:border-red-500" : ""
            } ${className}`}
            placeholder=""
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
          <label
            className={`absolute left-6 pointer-events-none ${
              isInitialized ? "transition-all duration-200" : ""
            } ${
              isFocused || hasValue
                ? "top-3 text-xs text-gray-500"
                : "top-1/2 translate-y-1 text-base text-gray-400"
            }`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        {tooltip && (
          <p className="text-xs text-gray-500 mt-1 px-6">{tooltip}</p>
        )}
        <ErrorMessage error={error} />
      </div>
    );
  }
);

InputField.displayName = "InputField";
