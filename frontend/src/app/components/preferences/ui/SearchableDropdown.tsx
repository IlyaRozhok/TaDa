import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import styles from "./CustomDropdown.module.scss";

export interface SearchableDropdownOption {
  value: string | number | "";
  label: string;
}

interface SearchableDropdownProps {
  label: string;
  value: string | number | "";
  options: SearchableDropdownOption[];
  onChange: (value: string | number | "") => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option",
  error,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    direction: "up" | "down";
  }>({ top: 0, left: 0, width: 0, direction: "down" });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || "";
  const hasValue = value !== "" && value !== "";

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Initialize component to enable animations after first render
  useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  const handleOptionClick = (optionValue: string | number | "") => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 300; // Approximate dropdown height with search
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
      setSearchQuery("");
    }
    setIsOpen(!isOpen);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      handleToggle();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input Field */}
      <div
        ref={inputRef}
        className={`w-full px-6 pt-7 pb-5 pr-12 rounded-3xl focus:outline-none transition-all duration-200 bg-white cursor-pointer border-0 flex items-center min-h-[3.5rem] ${
          hasValue ? "text-gray-900" : "text-gray-400"
        } ${error ? "ring-2 ring-red-400 focus:ring-red-500" : ""}`}
        onClick={handleToggle}
      >
        {hasValue ? (
          displayValue
        ) : (
          <span className="flex items-center">
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

      {/* Dropdown List with Search */}
      {isOpen && (
        <div
          className={`fixed backdrop-blur-[3px] z-[9999] ${styles.dropdownCard}`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={handleInputClick}
                placeholder="Search nationality..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Options List */}
          <div
            className={styles.scrollContainer}
            style={{ maxHeight: "250px" }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={String(option.value)}
                  className={`${styles.dropdownItem} ${
                    value === option.value ? styles.selected : ""
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  <div className={styles.optionContent}>
                    <div className={styles.postcode}>{option.label}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-white/70 text-sm text-center">
                No nationalities found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1 ml-6">{error}</p>}
    </div>
  );
};
