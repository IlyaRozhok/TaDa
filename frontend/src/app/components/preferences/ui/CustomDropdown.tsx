import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./CustomDropdown.module.scss";

interface Option {
  value: string;
  label: string;
  postcode?: string;
  address?: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
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
      setTimeout(() => setIsInitialized(true), 100);
    }
  }, [isInitialized]);

  const selectedOption = options.find((option) => option.value === value);

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-6 pt-8 pb-4 pr-12 bg-gray-50 sm:bg-white rounded-full cursor-pointer
          flex items-center 
          transition-all duration-200 focus:outline-none
          ${error ? "border-red-400" : ""}
          ${isOpen ? "" : ""}
        `}
      >
        <span className={selectedOption ? "text-gray-900" : "text-transparent"}>
          {selectedOption
            ? selectedOption.postcode || selectedOption.label
            : placeholder || "Select option"}
        </span>
      </div>

      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

      <label
        className={`absolute left-6 pointer-events-none ${
          isInitialized ? "transition-all duration-200" : ""
        } ${
          selectedOption || isOpen
            ? "top-3 text-xs text-gray-500"
            : "top-1/2 -translate-y-1/2 text-base text-gray-400"
        }`}
      >
        {label}
      </label>

      {error && <p className="mt-1 text-sm text-red-600 px-6">{error}</p>}

      {isOpen && (
        <div
          className={`absolute backdrop-blur-[3px] bottom-full sm:top-full sm:bottom-auto mb-2 sm:mt-2 sm:mb-0 left-0 right-0 z-50 ${styles.dropdownCard}`}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              className={`${styles.dropdownItem} ${
                option.value === value ? styles.selected : ""
              }`}
            >
              <div className={styles.postcodeIcon}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.optionContent}>
                <span className={styles.postcode}>
                  {option.postcode || option.value}
                </span>
                {option.address && (
                  <span className={styles.address}>{option.address}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
