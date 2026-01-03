"use client";

import React from "react";
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

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

  const formattedValue = formatDateValue(value);

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && <p className="text-sm text-gray-500">{description}</p>}

      <input
        id={name}
        name={name}
        type="date"
        value={formattedValue}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
          "text-gray-900 placeholder-gray-400",
          // Hide calendar icon across browsers
          "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0",
          "[&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden",
          "appearance-none",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500"
        )}
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DateInput;
