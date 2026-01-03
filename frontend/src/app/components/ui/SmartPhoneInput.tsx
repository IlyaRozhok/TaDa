"use client";

import React, { useState, useCallback } from "react";
import { IMaskInput } from "react-imask";

interface SmartPhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
}

const SmartPhoneInput = React.forwardRef<HTMLInputElement, SmartPhoneInputProps>(
  ({
    label,
    required = false,
    tooltip,
    error,
    className = "",
    value,
    onChange,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = !!value;

    const handleAccept = useCallback((newValue: string) => {
      // Clean the value (remove formatting, keep only digits and +)
      const cleanValue = newValue.replace(/[^\d+]/g, '');
      onChange(cleanValue);
    }, [onChange]);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    // Simple mask that allows international phone numbers
    const mask = "000000000000000"; // Allow up to 15 digits

    return (
      <div className="relative">
        <div className="relative">
          <IMaskInput
            ref={ref}
            mask={mask}
            value={value}
            onAccept={handleAccept}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent peer border-0 ${
              error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
            } ${className}`}
            placeholder=""
            {...props}
          />

          <label
            className={`absolute left-6 pointer-events-none transition-all duration-200 ${
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

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}

        {/* Format hint */}
        <p className="text-xs text-gray-400 mt-1 px-6">
          Enter your phone number with country code (e.g., +380930794870 for Ukraine)
        </p>
      </div>
    );
  }
);

SmartPhoneInput.displayName = "SmartPhoneInput";

export default SmartPhoneInput;
