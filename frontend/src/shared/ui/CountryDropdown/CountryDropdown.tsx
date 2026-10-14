"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  COUNTRIES,
  getCountryByName,
  type Country,
} from "../../lib/countries";

export interface CountryDropdownProps {
  /** Current selected country name */
  value?: string;
  /** Callback when country changes */
  onChange: (countryName: string) => void;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Error message */
  error?: string;
}

/**
 * CountryDropdown component for selecting nationality
 * Uses the same style as PhoneMaskInput country selector
 */
export default function CountryDropdown({
  value,
  onChange,
  label = "Nationality",
  placeholder = "Select nationality",
  className = "",
  disabled = false,
  required = false,
  error,
}: CountryDropdownProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    () => (value ? (getCountryByName(value) ?? null) : null)
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected country when value prop changes
  useEffect(() => {
    if (value) {
      const country = getCountryByName(value);
      if (country) {
        setSelectedCountry(country);
      }
    } else {
      setSelectedCountry(null);
    }
  }, [value]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");
    onChange(country.name);
  };

  // Filter countries based on search query
  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    // Not on mobile: the keyboard would cover the bottom sheet's list.
    if (isDropdownOpen && searchInputRef.current && window.matchMedia("(min-width: 640px)").matches) {
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const hasValue = !!selectedCountry;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`w-full px-6 pt-6 pb-6 rounded-3xl focus:outline-none transition-all duration-200 text-left flex items-center justify-between ${
            hasValue ? "text-gray-900" : "text-gray-400"
          } bg-gray-50 sm:bg-white border-0 ${
            error ? "ring-1 ring-red-400 focus:ring-red-500" : ""
          } disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center min-w-0 flex-1">
            <span className="truncate">
              {selectedCountry ? selectedCountry.name : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Floating Label */}
        {hasValue && (
          <label
            className={`absolute left-6 pointer-events-none transition-all duration-200 top-3 text-xs text-gray-500`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>

      {/* Dropdown */}
      {isDropdownOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 sm:z-40 sm:bg-transparent"
            onClick={() => setIsDropdownOpen(false)}
          />
          {/* Mobile: a bottom sheet above the fixed wizard footer (z-50).
              From sm: the menu opening upward over the field, as before. */}
          <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[70dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom)] sm:absolute sm:inset-x-auto sm:bottom-full sm:left-0 sm:z-50 sm:mb-1 sm:w-full sm:max-h-60 sm:rounded-3xl sm:pb-0 overflow-hidden flex flex-col backdrop-blur-[3px]">
            <div
              className="relative flex flex-col min-h-0 rounded-t-3xl sm:rounded-3xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
                boxShadow:
                  "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="relative z-10 flex flex-col min-h-0">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200/20 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Search country..."
                      className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 text-base focus:outline-none"
                    />
                  </div>
                </div>

                {/* Countries List */}
                <div className="overflow-y-auto overscroll-contain min-h-0 max-h-[calc(70dvh-4.5rem)] sm:max-h-48">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountryChange(country)}
                        className={`w-full px-5 py-3 text-left transition-all duration-200 flex items-center ${
                          selectedCountry?.code === country.code
                            ? "bg-white/18 text-white"
                            : "text-white hover:bg-white/12"
                        }`}
                        style={{
                          backdropFilter:
                            selectedCountry?.code === country.code
                              ? "blur(10px)"
                              : undefined,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-semibold truncate"
                            style={{ fontWeight: 600 }}
                          >
                            {country.name}
                          </div>
                        </div>
                        {selectedCountry?.code === country.code && (
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

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1 px-6" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
