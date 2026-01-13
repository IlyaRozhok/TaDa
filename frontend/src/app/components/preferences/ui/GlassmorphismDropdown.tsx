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
  required?: boolean;
}

export const GlassmorphismDropdown: React.FC<GlassmorphismDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option",
  error,
  icon,
  noPreferenceValue = "",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    direction: "up" | "down";
  }>({ top: 0, left: 0, width: 0, direction: "down" });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

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

    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize);
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

  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Approximate dropdown height
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine direction based on available space
    const direction =
      spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "up" : "down";

    setDropdownPosition({
      top: direction === "up" ? rect.top - dropdownHeight : rect.bottom,
      left: rect.left,
      width: rect.width,
      direction,
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input Field */}
      <div
        ref={inputRef}
        className={`w-full px-6 pt-8 pb-4 pr-12 rounded-3xl focus:outline-none transition-all duration-200 bg-white cursor-pointer border-0 ${
          hasValue ? "text-gray-900" : "text-gray-400"
        } ${error ? "ring-2 ring-red-400 focus:ring-red-500" : ""}`}
        onClick={handleToggle}
      >
        {hasValue ? (
          displayValue
        ) : (
          <span>
            {placeholder}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        )}
      </div>

      {/* Floating label */}
      {hasValue && (
        <label
          className={`absolute left-6 pointer-events-none ${
            isInitialized ? "transition-all duration-200" : ""
          } top-3 text-xs text-gray-500`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Arrow */}
      <ChevronDown
        className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      />

      {/* Dropdown List - Fixed positioning to prevent page height changes */}
      {isOpen && (
        <div
          className={`fixed backdrop-blur-[3px] z-[9999] ${styles.dropdownCard}`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
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
