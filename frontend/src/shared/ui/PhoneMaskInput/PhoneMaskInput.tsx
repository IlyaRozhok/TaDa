"use client";

import React, { useState, useEffect, useCallback } from "react";
import { InputMask, InputMaskChangeEvent } from "primereact/inputmask";
import { ChevronDown } from "lucide-react";
import { getPhoneMask } from "../../lib/phoneMasks";
import {
  COUNTRIES,
  getCountryByCode,
  getDefaultCountry,
  type Country,
} from "../../lib/countries";

export interface PhoneMaskInputProps {
  /** Country code (ISO 3166-1 alpha-2, e.g., "US", "GB", "FR") */
  countryCode?: string;
  /** Current phone number value (without country code) */
  value?: string;
  /** Callback when phone number changes */
  onChange: (value: string | undefined) => void;
  /** Label text */
  label?: string;
  /** Placeholder text (defaults to mask pattern) */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Callback when country changes */
  onCountryChange?: (countryCode: string) => void;
  /** Additional props for InputMask component */
  inputMaskProps?: Omit<
    React.ComponentProps<typeof InputMask>,
    "value" | "onChange" | "mask" | "placeholder"
  >;
}

/**
 * PhoneMaskInput component using PrimeReact InputMask
 * Applies country-specific phone number masks based on country code
 * Includes country code selector with fixed width
 */
export default function PhoneMaskInput({
  countryCode: initialCountryCode = "US",
  value,
  onChange,
  label,
  placeholder,
  className = "",
  disabled = false,
  required = false,
  error,
  onCountryChange,
  inputMaskProps,
}: PhoneMaskInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() =>
    getCountryByCode(initialCountryCode) || getDefaultCountry()
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Update selected country when countryCode prop changes
  useEffect(() => {
    const country = getCountryByCode(initialCountryCode);
    if (country) {
      setSelectedCountry(country);
    }
  }, [initialCountryCode]);

  // Get mask for the current country code
  const mask = getPhoneMask(selectedCountry.code);

  // Use custom placeholder or empty string (no mask placeholder)
  const displayPlaceholder = placeholder || "";

  const handleChange = (e: InputMaskChangeEvent) => {
    const newValue = e.value;
    onChange(newValue);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    // Reset phone value when country changes
    onChange("");
    onCountryChange?.(country.code);
  };

  const hasValue = !!value;

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex">
        {/* Country Code Selector - Fixed Width */}
        <div className="relative w-36 flex-shrink-0">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="flex items-center justify-between px-3 py-4 bg-white border-0 rounded-l-3xl hover:bg-gray-50 transition-colors h-full shadow-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">{selectedCountry.flag}</span>
              <span className="text-sm font-medium text-gray-700 truncate">
                {selectedCountry.dialCode}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && !disabled && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 z-50 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountryChange(country)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      selectedCountry.code === country.code ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {country.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {country.dialCode}
                      </div>
                    </div>
                    {selectedCountry.code === country.code && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <InputMask
              value={value ?? ""}
              onChange={handleChange}
              mask={mask}
              placeholder={displayPlaceholder}
              disabled={disabled}
              required={required}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              slotChar="_"
              unmask={false}
              className={`w-full px-6 pt-8 pb-4 rounded-r-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-gray-400 border-0 shadow-sm ${
                error
                  ? "ring-2 ring-red-400 focus:ring-red-500"
                  : "focus:ring-2 focus:ring-blue-500"
              } ${inputMaskProps?.className || ""}`}
              {...inputMaskProps}
            />

            {/* Floating Label */}
            <label
              className={`absolute left-6 pointer-events-none transition-all duration-200 ${
                isFocused || hasValue
                  ? "top-3 text-xs text-gray-500"
                  : "top-1/2 -translate-y-1/2 text-base text-gray-400"
              }`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1 px-6">{error}</p>
      )}

      {/* Format hint */}
      <p className="text-xs text-gray-400 mt-1 px-6">
        Format: {selectedCountry.dialCode} {mask.replace(/9/g, "#")}
      </p>
    </div>
  );
}

