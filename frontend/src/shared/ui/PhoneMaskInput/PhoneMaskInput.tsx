"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  detectPhoneCountry,
  formatPhoneInput,
  hasPhoneDigits,
  phoneErrorMessage,
  phoneValidationIssue,
  type PhoneIssue,
} from "@/shared/lib/phone";
import {
  COUNTRIES,
  getCountryByCode,
  getDefaultCountry,
  type Country,
} from "@/shared/lib/countries";

export interface PhoneMaskInputProps {
  countryCode?: string;
  /** The number as shown in the field (not E.164). */
  value?: string;
  /**
   * `detectedCountry` is set when an internationally typed number ("+33 6…",
   * "0044 7…") belongs to another country than the selected one: the flag
   * has already switched, and the caller should store that country too.
   */
  onChange: (value: string | undefined, detectedCountry?: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  /**
   * Show the spec's inline message for the number's problem (too short, too
   * long, not a mobile, invalid — and empty when `required`) once the user
   * leaves the field. Callers that render their own phone errors leave it off.
   */
  validate?: boolean;
  /**
   * Turns a validation issue into the text to show — for callers with their
   * own (translated) copy. Without it the shared English messages are used.
   */
  issueMessage?: (issue: PhoneIssue) => string;
  onCountryChange?: (countryCode: string) => void;
}

export default function PhoneMaskInput({
  // GB, not US: this is a UK rental platform, and the only callers that relied
  // on the default were opening a form for a London flat. Every existing
  // caller passes `countryCode` explicitly, so this moves nothing but the
  // fallback.
  countryCode: initialCountryCode = "GB",
  value,
  onChange,
  label,
  placeholder,
  className = "",
  disabled = false,
  required = false,
  error,
  validate = false,
  issueMessage,
  onCountryChange,
}: PhoneMaskInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () => getCountryByCode(initialCountryCode) || getDefaultCountry(),
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  // Left the field at least once: from then on an empty required field is
  // reported too, not only a wrong number.
  const [isTouched, setIsTouched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const country = getCountryByCode(initialCountryCode);
    if (country) setSelectedCountry(country);
  }, [initialCountryCode]);

  const displayPlaceholder = placeholder || "";

  /**
   * Typing forward is re-formatted in the country's style; deleting is left
   * alone, or backspacing over a formatting space would put it straight back.
   * No length cap: a number that is too long stays visible and fails
   * validation rather than silently losing digits.
   */
  const handleInput = (raw: string) => {
    const previous = value ?? "";
    const next =
      raw.length < previous.length
        ? raw.replace(/[^\d+\s().-]/g, "")
        : formatPhoneInput(raw, selectedCountry.code);

    // "+33 6…" typed with GB selected: the flag follows the number, as long
    // as it is a country the selector offers.
    const detected = detectPhoneCountry(next);
    const detectedCountry =
      detected && detected !== selectedCountry.code ? getCountryByCode(detected) : undefined;
    if (detectedCountry) setSelectedCountry(detectedCountry);

    onChange(next || undefined, detectedCountry?.code);
  };

  /** The field's own check, in the caller's copy or the shared English. */
  const validationMessage = (): string | undefined => {
    const issue = phoneValidationIssue(value, selectedCountry.code, { required });
    if (!issue) return undefined;
    return issueMessage ? issueMessage(issue) : phoneErrorMessage(value, selectedCountry.code, { required });
  };

  const shownError =
    error ||
    (validate && !isFocused && (isTouched || hasPhoneDigits(value)) ? validationMessage() : undefined);

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
    // Not on mobile: the keyboard would cover the bottom sheet's list.
    if (isDropdownOpen && searchInputRef.current && window.matchMedia("(min-width: 640px)").matches) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) setSearchQuery("");
  }, [isDropdownOpen]);

  const hasValue = !!value;

  return (
    <div className={`relative ${className}`}>
      {/* The form fields' shared look (InputField, DateInput, CountryDropdown):
          the bg-field fill, no border, rounded-4xl. The error ring goes
          round the whole row (selector and number), 1px. */}
      <div className={`relative flex rounded-4xl ${shownError ? "ring-1 ring-red-400 focus-within:ring-red-500" : ""}`}>
        {/* Country Code Selector */}
        <div className="relative min-w-[11rem] max-w-[13rem] flex-shrink-0">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="flex items-center cursor-pointer justify-between gap-2 px-5 py-4 bg-field border-0 rounded-l-4xl hover:bg-gray-200 transition-colors h-full w-full disabled:opacity-50 disabled:cursor-not-allowed text-left"
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
              {/* Mobile: a bottom sheet over a dimmed page, above the fixed
                  wizard footer (z-50), so it never overlaps or pushes the
                  form, its Send code button or the nav. From sm: the
                  dropdown under the selector, as before. */}
              <div className="fixed inset-0 z-[60] bg-black/40 sm:z-40 sm:bg-transparent" onClick={() => setIsDropdownOpen(false)} />
              <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[70dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:left-0 sm:z-50 sm:mt-1 sm:w-80 sm:max-h-60 sm:rounded-3xl sm:pb-0 overflow-hidden flex flex-col backdrop-blur-[3px]">
                <div
                  className="relative flex flex-col min-h-0 rounded-t-3xl sm:rounded-3xl"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%), rgba(0,0,0,0.5)",
                    boxShadow: "0 1.5625rem 3.125rem rgba(0,0,0,0.4), 0 0.625rem 1.875rem rgba(0,0,0,0.2), inset 0 0.0625rem 0 rgba(255,255,255,0.1), inset 0 -0.0625rem 0 rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="relative z-10 flex flex-col min-h-0">
                    <div className="p-3 flex-shrink-0">
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
                    <div className="overflow-y-auto overscroll-contain min-h-0 max-h-[calc(70dvh-4.5rem)] sm:max-h-48">
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
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={value ?? ""}
              onChange={(e) => handleInput(e.target.value)}
              placeholder={displayPlaceholder}
              disabled={disabled}
              required={required}
              aria-invalid={shownError ? true : undefined}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                setIsTouched(true);
              }}
              className={`w-full px-6 pt-8 pb-4 rounded-r-4xl focus:outline-none transition-all duration-200 text-gray-900 bg-field placeholder-gray-400 border-0`}
            />
            <label
              className={`absolute left-6 pointer-events-none transition-all duration-200 ${isFocused || hasValue ? "top-3 text-xs text-gray-600" : "top-1/2 -translate-y-1/2 text-base text-gray-500"}`}
            >
              {label}
            </label>
          </div>
        </div>
      </div>

      {/* Below the field, never inside it, with room to breathe. */}
      {shownError && (
        <p role="alert" className="text-sm text-red-600 mt-3 px-6">
          {shownError}
        </p>
      )}
    </div>
  );
}
