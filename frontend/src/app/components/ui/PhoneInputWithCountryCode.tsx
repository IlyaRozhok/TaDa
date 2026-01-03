"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  mask: string;
}

const COUNTRIES: Country[] = [
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', mask: '9999 999999' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', mask: '(999) 999-9999' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', mask: '(999) 999-9999' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', mask: '(99) 999 99 99' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', mask: '999 99999999' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', mask: '9 99 99 99 99' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', mask: '999 999 9999' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', mask: '999 99 99 99' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', mask: '9 99999999' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', mask: '(999) 999-99-99' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', mask: '999 999 999' },
];

interface PhoneInputWithCountryCodeProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  required?: boolean;
}

export default function PhoneInputWithCountryCode({
  label,
  value,
  onChange,
  error,
  className = "",
  required = false,
}: PhoneInputWithCountryCodeProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Parse the full phone number to extract country and number
  const parsePhoneNumber = useCallback((fullNumber: string) => {
    if (!fullNumber) return { country: COUNTRIES[0], number: "" };

    // Find country by dial code
    const country = COUNTRIES.find(c => fullNumber.startsWith(c.dialCode)) || COUNTRIES[0];
    const number = fullNumber.slice(country.dialCode.length).trim();
    
    return { country, number };
  }, []);

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const { country, number } = parsePhoneNumber(value);
      setSelectedCountry(country);
      setPhoneNumber(number);
    }
  }, [value, parsePhoneNumber]);

  // Apply mask to phone number with digit limit - format immediately
  const applyMask = useCallback((input: string, mask: string) => {
    const digits = input.replace(/\D/g, '');
    const maxDigits = mask.split('9').length - 1; // Count number of '9' in mask
    const limitedDigits = digits.slice(0, maxDigits); // Limit input to mask capacity
    
    let result = '';
    let digitIndex = 0;

    // Apply formatting as soon as we have digits
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === '9') {
        if (digitIndex < limitedDigits.length) {
          result += limitedDigits[digitIndex];
          digitIndex++;
        } else {
          // Stop adding mask characters if no more digits
          break;
        }
      } else {
        // Only add separator if we have more digits coming
        if (digitIndex < limitedDigits.length) {
          result += mask[i];
        }
      }
    }

    return result;
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Only digits
    const maxDigits = selectedCountry.mask.split('9').length - 1;
    const limitedInput = input.slice(0, maxDigits); // Limit to mask capacity
    
    // Always apply mask, even for incomplete numbers
    const maskedNumber = applyMask(limitedInput, selectedCountry.mask);
    
    setPhoneNumber(maskedNumber);
    
    // Combine country code with phone number (use limited input for storage)
    const fullNumber = limitedInput ? `${selectedCountry.dialCode}${limitedInput}` : "";
    onChange(fullNumber);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    
    // Update full number with new country code
    const digits = phoneNumber.replace(/\D/g, '');
    const fullNumber = digits ? `${country.dialCode}${digits}` : "";
    onChange(fullNumber);
  };

  const hasValue = !!phoneNumber;

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex">
        {/* Country Code Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-4 bg-white border-0 rounded-l-3xl hover:bg-gray-50 transition-colors h-full shadow-sm"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    selectedCountry.code === country.code ? 'bg-blue-50' : ''
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
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full px-6 pt-8 pb-4 rounded-r-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm ${
              error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
            }`}
            placeholder=""
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

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1 px-6">{error}</p>
      )}

      {/* Format hint */}
      <p className="text-xs text-gray-400 mt-1 px-6">
        Format: {selectedCountry.dialCode} {selectedCountry.mask.replace(/9/g, '#')}
      </p>
    </div>
  );
}
