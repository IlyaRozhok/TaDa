"use client";

import React, { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { cn } from "@/app/lib/utils";

interface DateInputProps {
  label: string;
  name: string;
  value: string | null;
  onChange: (date: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  description?: string;
  minDate?: string; // ISO date string (YYYY-MM-DD)
  maxDate?: string; // ISO date string (YYYY-MM-DD)
  disabled?: boolean;
  placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  className = "",
  description,
  minDate,
  maxDate,
  disabled = false,
  placeholder,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [displayValue, setDisplayValue] = useState("");

  // Initialize component to enable animations after first render
  useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  // Convert YYYY-MM-DD to DD.MM.YYYY for display
  const formatDateForDisplay = (dateValue: string | null): string => {
    if (!dateValue) return "";

    try {
      // If it's already in YYYY-MM-DD format, convert to DD.MM.YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split("-");
        return `${day}.${month}.${year}`;
      }

      // Try to parse and format the date
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }

      return "";
    } catch {
      return "";
    }
  };

  // Convert DD.MM.YYYY to YYYY-MM-DD for storage
  const parseDateFromDisplay = (displayDate: string): string | null => {
    if (!displayDate) return null;

    // Remove all non-digit characters
    const digitsOnly = displayDate.replace(/\D/g, "");

    // If we have 8 digits (DDMMYYYY), convert to YYYY-MM-DD
    if (digitsOnly.length === 8) {
      const day = digitsOnly.substring(0, 2);
      const month = digitsOnly.substring(2, 4);
      const year = digitsOnly.substring(4, 8);

      // Validate date
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        // Check if parsed date matches input (handles invalid dates like 31.02.2024)
        if (
          date.getDate() === parseInt(day) &&
          date.getMonth() + 1 === parseInt(month) &&
          date.getFullYear() === parseInt(year)
        ) {
          const isoDate = `${year}-${month}-${day}`;
          // Return the date even if out of range - let parent component validate
          // This allows parent to show appropriate error messages
          return isoDate;
        }
      }
    }

    return null;
  };

  // Initialize display value from prop value
  useEffect(() => {
    setDisplayValue(formatDateForDisplay(value));
  }, [value]);

  const handleAccept = (maskedValue: string) => {
    setDisplayValue(maskedValue);
    // Only parse and update if we have a complete date (10 characters: DD.MM.YYYY)
    if (maskedValue.length === 10) {
      const isoDate = parseDateFromDisplay(maskedValue);
      // Always call onChange with the parsed date (even if null) so parent can validate
      // This allows parent components to show validation errors for invalid dates
      onChange(isoDate || "");
    } else if (maskedValue.length === 0) {
      onChange("");
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // On blur, if the value is incomplete, clear it
    if (displayValue && displayValue.length < 10) {
      setDisplayValue("");
      onChange("");
    }
  };

  const hasValue = !!displayValue && displayValue.length === 10;
  const shouldShowFocusedLabel = true;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <IMaskInput
          id={name}
          name={name}
          mask="00.00.0000"
          value={displayValue}
          onAccept={handleAccept}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="DD.MM.YYYY"
          inputRef={(el) => {
            if (el) {
              // Ensure input type is text to hide calendar picker on desktop
              el.type = "text";
            }
          }}
          className={cn(
            "w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-gray-400 border-0",
            "[&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden",
            "appearance-none",
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
          )}
        />

        {/* Floating Label */}
        <label
          htmlFor={name}
          className={cn(
            "absolute left-6 pointer-events-none",
            isInitialized ? "transition-all duration-200" : "",
            shouldShowFocusedLabel
              ? "top-3 text-xs text-gray-500"
              : "top-1/3 translate-y-1 text-base text-gray-400"
          )}
        >
          {label}
        </label>
      </div>

      {description && (
        <p className="text-xs text-gray-500 mt-1 px-6">{description}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1 px-6" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DateInput;
