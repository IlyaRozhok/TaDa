"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { InputMask, InputMaskChangeEvent } from "primereact/inputmask";
import { ChevronDown, Search } from "lucide-react";
import { getPhoneMask } from "@/shared/lib/phoneMasks";
import {
  COUNTRIES,
  getCountryByCode,
  getDefaultCountry,
  type Country,
} from "@/shared/lib/countries";

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
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () => getCountryByCode(initialCountryCode) || getDefaultCountry()
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    onChange(newValue ?? undefined);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");
    // Reset phone value when country changes
    onChange("");
    onCountryChange?.(country.code);
  };

  // Filter countries based on search query
  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isDropdownOpen]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isDropdownOpen) {
      setSearchQuery("");
    }
  }, [isDropdownOpen]);

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
            className="flex items-center cursor-pointer justify-between px-3 py-4 bg-gray-50 sm:bg-white border-0 rounded-l-3xl hover:bg-gray-100 sm:hover:bg-gray-50 transition-colors h-full w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">
                {selectedCountry.flag}
              </span>
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
              <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-3xl max-h-60 overflow-hidden flex flex-col backdrop-blur-[3px]">
                <div
                  className="relative rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
                    boxShadow:
                      "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <div className="relative z-10">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200/20">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Search country..."
                          className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Countries List */}
                    <div
                      className="overflow-y-auto max-h-48"
                      style={{ maxHeight: "12rem" }}
                    >
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountryChange(country)}
                            className={`w-full px-5 py-3 text-left transition-all duration-200 flex items-center gap-3 ${
                              selectedCountry.code === country.code
                                ? "bg-white/18 text-white"
                                : "text-white hover:bg-white/12"
                            }`}
                            style={{
                              backdropFilter:
                                selectedCountry.code === country.code
                                  ? "blur(10px)"
                                  : undefined,
                            }}
                          >
                            <span className="text-lg">{country.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-semibold truncate"
                                style={{ fontWeight: 600 }}
                              >
                                {country.name}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: "rgba(255, 255, 255, 0.7)" }}
                              >
                                {country.dialCode}
                              </div>
                            </div>
                            {selectedCountry.code === country.code && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-white/70 text-center">
                          No countries found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
              className={`w-full px-6 pt-8 pb-4 rounded-r-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-gray-50 sm:bg-white placeholder-gray-400 border-0 ${
                error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
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
            </label>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600 mt-1 px-6">{error}</p>}
    </div>
  );
}
