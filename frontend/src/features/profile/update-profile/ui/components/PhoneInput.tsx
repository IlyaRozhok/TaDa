/**
 * Phone Input Component
 * 
 * Handles phone number input with country code selection.
 * Separated from main ProfileForm for better reusability.
 */

import React, { useState, useEffect, useCallback } from 'react';

import { PhoneMaskInput, CountryDropdown } from '@/shared/ui';
import {
  getCountryByDialCode,
  getCountryByCode,
  getDefaultCountry,
} from '@/shared/lib/countries';

interface PhoneInputProps {
  value?: string;
  onChange: (phone: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PhoneInput({
  value = '',
  onChange,
  label = 'Phone Number',
  placeholder = 'Enter your phone number',
  error,
  disabled = false,
  required = false,
}: PhoneInputProps): JSX.Element {
  const [countryCode, setCountryCode] = useState('GB'); // Default to GB
  const [phoneNumberOnly, setPhoneNumberOnly] = useState('');

  // Parse initial phone value
  useEffect(() => {
    if (value) {
      // Try to extract country code from phone number
      const country = getCountryByDialCode(value);
      if (country) {
        setCountryCode(country.code);
        setPhoneNumberOnly(value.replace(country.dialCode, '').trim());
      } else {
        // Fallback - assume it's just the number
        setPhoneNumberOnly(value);
      }
    }
  }, [value]);

  const handleCountryChange = useCallback((countryName: string) => {
    const country = getCountryByCode(countryName) || getDefaultCountry();
    setCountryCode(country.code);
    
    // Update full phone number
    const fullPhone = phoneNumberOnly 
      ? `${country.dialCode} ${phoneNumberOnly}`.trim()
      : '';
    onChange(fullPhone);
  }, [phoneNumberOnly, onChange]);

  const handlePhoneChange = useCallback((phone: string) => {
    setPhoneNumberOnly(phone);
    
    // Update full phone number with country code
    const country = getCountryByCode(countryCode) || getDefaultCountry();
    const fullPhone = phone 
      ? `${country.dialCode} ${phone}`.trim()
      : '';
    onChange(fullPhone);
  }, [countryCode, onChange]);

  const selectedCountry = getCountryByCode(countryCode) || getDefaultCountry();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Country Selection */}
        <div className="md:col-span-1">
          <CountryDropdown
            value={selectedCountry.name}
            onChange={handleCountryChange}
            placeholder="Select country"
            disabled={disabled}
          />
        </div>

        {/* Phone Number Input */}
        <div className="md:col-span-2">
          <PhoneMaskInput
            value={phoneNumberOnly}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            countryCode={countryCode}
            disabled={disabled}
            error={error}
          />
        </div>
      </div>

      {/* Country Code Display */}
      {selectedCountry.dialCode && (
        <p className="text-xs text-gray-500">
          Country code: {selectedCountry.dialCode}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}