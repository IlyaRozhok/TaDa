"use client";

import React, { useState, useEffect } from "react";

interface StyledDateInputProps {
  label: string;
  value: string | null;
  onChange: (date: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  minDate?: string; // ISO date string (YYYY-MM-DD)
  maxDate?: string; // ISO date string (YYYY-MM-DD)
  disabled?: boolean;
}

export const StyledDateInput: React.FC<StyledDateInputProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  className = "",
  minDate,
  maxDate,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize component to enable animations after first render
  useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  // Format date value for input (ensure it's in YYYY-MM-DD format)
  const formatDateValue = (dateValue: string | null): string => {
    if (!dateValue) return "";

    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      // Try to parse and format the date
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }

      return "";
    } catch {
      return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const formattedValue = formatDateValue(value);
  const hasValue = !!formattedValue;

  // For date inputs, always keep label in "focused" position since date inputs
  // always show their placeholder format (dd.mm.yyyy, mm/dd/yyyy, etc.)
  const shouldShowFocusedLabel = true;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="date"
          value={formattedValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          min={minDate}
          max={maxDate}
          disabled={disabled}
          required={required}
          className={`w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent peer border-0 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden ${
            error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
          }`}
        />

        {/* Floating Label */}
        <label
          className={`absolute left-6 pointer-events-none ${
            isInitialized ? "transition-all duration-200" : ""
          } ${
            shouldShowFocusedLabel
              ? "top-3 text-xs text-gray-500"
              : "top-1/2 -translate-y-1/2 text-base text-gray-400"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600 mt-1 px-6">{error}</p>}
    </div>
  );
};

export default StyledDateInput;
