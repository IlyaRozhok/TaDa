"use client";

import React, { useState, useEffect, useRef } from "react";
import { IMaskInput } from "react-imask";
import { ChevronDown, Search } from "lucide-react";
import { getPhoneMask } from "@/shared/lib/phoneMasks";
import {
  COUNTRIES,
  getCountryByCode,
  getDefaultCountry,
  type Country,
} from "@/shared/lib/countries";

export interface PhoneMaskInputProps {
  countryCode?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onCountryChange?: (countryCode: string) => void;
}

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
}: PhoneMaskInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () => getCountryByCode(initialCountryCode) || getDefaultCountry(),
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const country = getCountryByCode(initialCountryCode);
    if (country) setSelectedCountry(country);
  }, [initialCountryCode]);

  const mask = getPhoneMask(selectedCountry.code);
  const displayPlaceholder = placeholder || "";

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");
    onChange("");
    onCountryChange?.(country.code);
  };

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) setSearchQuery("");
  }, [isDropdownOpen]);

  const hasValue = !!value;

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex">
        {/* Country Code Selector */}
        <div className="relative min-w-[11rem] max-w-[13rem] flex-shrink-0">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="flex items-center cursor-pointer justify-between gap-2 px-5 py-4 bg-white rounded-l-4xl hover:bg-gray-50 transition-colors h-full w-full disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-gray-700 truncate leading-tight">
                {selectedCountry.name}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {selectedCountry.dialCode}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && !disabled && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-3xl max-h-60 overflow-hidden flex flex-col backdrop-blur-[3px]">
                <div
                  className="relative rounded-3xl"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%), rgba(0,0,0,0.5)",
                    boxShadow: "0 1.5625rem 3.125rem rgba(0,0,0,0.4), 0 0.625rem 1.875rem rgba(0,0,0,0.2), inset 0 0.0625rem 0 rgba(255,255,255,0.1), inset 0 -0.0625rem 0 rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="relative z-10">
                    <div className="p-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Search country..."
                          className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/50 text-base focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountryChange(country)}
                            className={`w-full px-5 py-3 text-left transition-all duration-200 flex cursor-pointer items-center gap-3 ${selectedCountry.code === country.code ? "bg-white/18 text-white" : "text-white hover:bg-white/12"}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate">{country.name}</div>
                              <div className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{country.dialCode}</div>
                            </div>
                            {selectedCountry.code === country.code && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-white/70 text-center">No countries found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Phone Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <IMaskInput
              mask={mask}
              value={value ?? ""}
              onAccept={(val: string) => onChange(val || undefined)}
              placeholder={displayPlaceholder}
              disabled={disabled}
              required={required}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full px-6 pt-8 pb-4 rounded-r-4xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-gray-400 ${error ? "ring-2 ring-red-400 focus:ring-red-500" : ""}`}
            />
            <label
              className={`absolute left-6 pointer-events-none transition-all duration-200 ${isFocused || hasValue ? "top-3 text-xs text-gray-600" : "top-1/2 -translate-y-1/2 text-base text-gray-500"}`}
            >
              {label}
            </label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-1 px-6">{error}</p>}
    </div>
  );
}
