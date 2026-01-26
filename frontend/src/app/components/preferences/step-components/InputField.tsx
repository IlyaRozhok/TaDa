import React from "react";
import { IMaskInput } from "react-imask";
import SmartPhoneInput from "../../ui/SmartPhoneInput";

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number" | "email" | "password" | "tel" | "date";
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
  minDate?: string; // For date inputs
  maxDate?: string; // For date inputs
  required?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  min,
  max,
  className = "",
  minDate,
  maxDate,
  required = false,
}) => {
  // Format date value for input (ensure it's in YYYY-MM-DD format)
  const formatDateValue = (dateValue: string | number | null): string => {
    if (!dateValue || type !== "date") return String(dateValue || "");

    try {
      const dateStr = String(dateValue);
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Try to parse and format the date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }

      return "";
    } catch {
      return "";
    }
  };

  const phoneMask = "9999 999999"; // Simple phone number mask
  const shouldUseMask = false; // Disable old mask
  const shouldUseSmartPhone = type === "tel";
  const displayValue = type === "date" ? formatDateValue(value) : value || "";

  const inputProps = {
    type: shouldUseMask ? "tel" : type,
    min: type === "date" ? minDate : min,
    max: type === "date" ? maxDate : max,
    value: displayValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue =
        type === "number" ? Number(e.target.value) : e.target.value;
      onChange(newValue);
    },
    className:
      "w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-gray-50 sm:bg-white placeholder-transparent border-0 shadow-sm",
    placeholder: "",
    required,
  };

  if (shouldUseSmartPhone) {
    return (
      <SmartPhoneInput
        label={label}
        value={value?.toString() || ""}
        onChange={(newValue) => onChange(newValue)}
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      {shouldUseMask ? (
        <IMaskInput
          mask={phoneMask}
          value={value || ""}
          onAccept={(newValue: string) => {
            const processedValue =
              type === "number" ? Number(newValue) : newValue;
            onChange(processedValue);
          }}
          className="w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-gray-50 sm:bg-white placeholder-transparent border-0 shadow-sm"
          placeholder=""
        />
      ) : (
        <input {...inputProps} />
      )}
      <label
        className={`absolute left-6 transition-all duration-200 pointer-events-none ${
          displayValue
            ? "top-3 text-xs text-gray-500"
            : "top-1/2 translate-y-1 text-base text-gray-400"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
};
