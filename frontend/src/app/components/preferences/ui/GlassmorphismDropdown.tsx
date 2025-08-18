import React, { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./CustomDropdown.module.scss";

export interface DropdownOption {
  value: string | number | "";
  label: string;
  postcode?: string;
  address?: string;
}

interface GlassmorphismDropdownProps {
  label: string;
  value: string | number | "";
  options: DropdownOption[];
  onChange: (value: string | number | "") => void;
  placeholder?: string;
  error?: string;
  icon?: ReactNode;
  noPreferenceValue?: string | number | "";
}

export const GlassmorphismDropdown: React.FC<GlassmorphismDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "No Preference",
  error,
  icon,
  noPreferenceValue = "no-preference",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  // Initialize component to enable animations after first render
  useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;
  const hasValue = value !== "" && value !== noPreferenceValue;

  const handleOptionClick = (optionValue: string | number | "") => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input Field */}
      <div
        className={`w-full px-6 pt-8 pb-4 pr-12 rounded-3xl focus:outline-none transition-all duration-200 bg-white cursor-pointer border-0 shadow-sm ${
          hasValue ? "text-gray-900" : "text-gray-400"
        } ${error ? "ring-2 ring-red-400 focus:ring-red-500" : ""}`}
        onClick={handleToggle}
      >
        {displayValue}
      </div>

      {/* Floating label */}
      {hasValue && (
        <label
          className={`absolute left-6 pointer-events-none ${
            isInitialized ? "transition-all duration-200" : ""
          } top-3 text-xs text-gray-500`}
        >
          {label}
        </label>
      )}

      {/* Dropdown Arrow */}
      <ChevronDown
        className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      />

      {/* Dropdown List - Absolute positioning with proper stacking context */}
      {isOpen && (
        <div
          className={`absolute backdrop-blur-[3px] top-full left-0 right-0 mt-2 z-[9999] ${styles.dropdownCard}`}
        >
          <div className={styles.scrollContainer}>
            {options.map((option) => (
              <div
                key={String(option.value)}
                className={`${styles.dropdownItem} ${
                  value === option.value ? styles.selected : ""
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                {/* Icon */}
                {icon && <div className={styles.postcodeIcon}>{icon}</div>}

                {/* Option Content */}
                <div className={styles.optionContent}>
                  <div className={styles.postcode}>
                    {option.postcode || option.label}
                  </div>
                  {option.address && (
                    <div className={styles.address}>{option.address}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1 ml-6">{error}</p>}
    </div>
  );
};
