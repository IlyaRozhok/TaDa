"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  useI18n,
  SUPPORTED_LANGUAGES,
  getLanguageDisplayCode,
} from "../contexts/I18nContext";

interface LanguageDropdownProps {
  /**
   * Variant for different contexts:
   * - "default": Light button on white background (for preferences, onboarding)
   * - "dark": White text on dark background (for landing pages)
   */
  variant?: "default" | "dark";
  /**
   * Custom className for the button
   */
  buttonClassName?: string;
  /**
   * Whether the dropdown is disabled
   */
  disabled?: boolean;
}

export default function LanguageDropdown({
  variant = "default",
  buttonClassName = "",
  disabled = false,
}: LanguageDropdownProps) {
  const { language, setLanguage } = useI18n();
  const selectedLanguage = getLanguageDisplayCode(language);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Base button classes
  const getButtonClasses = () => {
    if (variant === "dark") {
      return `flex items-center justify-center gap-1 px-2 py-1.5 text-sm font-medium text-white hover:text-gray-300 transition-colors rounded-lg w-14 cursor-pointer disabled:cursor-default disabled:hover:text-white ${buttonClassName}`;
    }
    return `flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${buttonClassName}`;
  };

  return (
    <div className="relative language-dropdown" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsLanguageOpen(!isLanguageOpen)}
        disabled={disabled}
        className={getButtonClasses()}
        aria-label="Select language"
      >
        <span
          className={variant === "dark" ? "min-w-[1.5rem] text-center" : ""}
        >
          {selectedLanguage}
        </span>
        <ChevronDown
          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 transition-transform ${
            isLanguageOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isLanguageOpen && (
        <div
          className="absolute right-0 top-full mt-1 sm:mt-2 rounded-xl min-w-[200px] sm:min-w-[240px] z-50 overflow-hidden backdrop-blur-[3px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
            boxShadow:
              "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
          }}
        >
          <div className="max-h-64 overflow-y-auto rounded-xl relative">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.langCode);
                  setIsLanguageOpen(false);
                }}
                className={`block w-full cursor-pointer px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg ${
                  selectedLanguage === lang.code
                    ? "bg-white/18 text-white font-semibold"
                    : "text-white hover:bg-white/12"
                }`}
                style={{
                  backdropFilter:
                    selectedLanguage === lang.code ? "blur(10px)" : undefined,
                  fontWeight: selectedLanguage === lang.code ? 600 : undefined,
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
