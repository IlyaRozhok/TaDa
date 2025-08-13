import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./CustomDropdown.module.scss";

interface LocationOption {
  value: string;
  label: string;
}

interface LocationDropdownProps {
  label: string;
  value: string;
  options: readonly LocationOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize component to enable animations after first render
  useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;
  const hasValue = value && value !== "no-preference";

  const handleOptionClick = (optionValue: string) => {
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

      {/* Dropdown List */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 z-50 ${styles.dropdownCard}`}
        >
          <div className={styles.scrollContainer}>
            {options.map((option) => (
              <div
                key={option.value}
                className={`${styles.dropdownItem} ${
                  value === option.value ? styles.selected : ""
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                {/* Location Name - No Icon */}
                <div className={styles.optionContent}>
                  <div className={styles.postcode}>{option.label}</div>
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
