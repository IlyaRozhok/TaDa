import React, { forwardRef, useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import SmartPhoneInput from "../../ui/SmartPhoneInput";
import { ErrorMessage } from "./ErrorMessage";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      required = false,
      tooltip,
      error,
      className = "",
      onChange,
      onFocus,
      onBlur,
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

    const shouldUseSmartPhone = props.type === "tel";
    const phoneMask = "9999 999999"; // Simple phone number mask
    const shouldUseMask = false; // Disable old mask logic

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
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

    const stringValue = props.value != null ? String(props.value) : "";

    return (
      <div className="relative">
        <div className="relative">
          {shouldUseSmartPhone ? (
            <SmartPhoneInput
              ref={ref}
              label={label}
              required={required}
              tooltip={tooltip}
              error={error}
              className={className}
              value={stringValue}
              onChange={(value: string) => {
                const event = {
                  target: { value },
                } as React.ChangeEvent<HTMLInputElement>;
                handleChange(event);
              }}
            />
          ) : shouldUseMask ? (
            <IMaskInput
              ref={ref}
              mask={phoneMask}
              value={stringValue}
              onAccept={(value: string) => {
                const event = {
                  target: { value },
                } as React.ChangeEvent<HTMLInputElement>;
                handleChange(event);
              }}
              className={`w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-gray-50 sm:bg-white placeholder-transparent peer border-0 ${
                error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
              } ${className}`}
              placeholder=""
            />
          ) : (
            <input
              ref={ref}
              {...props}
              className={`w-full px-6 pt-8 pb-5 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-gray-50 sm:bg-white placeholder-transparent peer border-0 ${
                error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
              } ${
                props.type === "number"
                  ? "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  : ""
              } ${className}`}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
            />
          )}
          <label
            className={`absolute left-6 pointer-events-none ${
              isInitialized ? "transition-all duration-200" : ""
            } ${
              isFocused || hasValue
                ? "top-3 text-xs text-gray-500"
                : "top-1/3 translate-y-1 text-base text-gray-400"
            }`}
          >
            {label}
          </label>
        </div>
        {tooltip && (
          <p className="text-xs text-gray-500 mt-1 px-6">{tooltip}</p>
        )}

      </div>
    );
  }
);

InputField.displayName = "InputField";
