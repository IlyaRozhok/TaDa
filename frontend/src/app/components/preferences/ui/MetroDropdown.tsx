import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface MetroOption {
  value: string;
  label: string;
}

interface MetroDropdownProps {
  label: string;
  value: string;
  options: readonly MetroOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const MetroDropdown: React.FC<MetroDropdownProps> = ({
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
      <div className="relative">
        {/* Input Field */}
        <div
          className={`w-full px-6 pt-8 pb-4 pr-12 rounded-3xl focus:outline-none transition-all duration-200 cursor-pointer border-0 shadow-sm ${
            hasValue ? "bg-black text-white" : "bg-white text-gray-400"
          } ${error ? "ring-2 ring-red-400 focus:ring-red-500" : ""}`}
          onClick={handleToggle}
        >
          <span className={hasValue ? "text-white font-medium" : "text-transparent"}>
            {displayValue}
          </span>
        </div>

        {/* Floating label */}
        <label
          className={`absolute left-6 pointer-events-none ${
            isInitialized ? "transition-all duration-200" : ""
          } ${
            hasValue || isOpen
              ? "top-3 text-xs text-gray-500"
              : "top-1/2 -translate-y-1/2 text-base text-gray-400"
          }`}
        >
          {label}
        </label>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-transform duration-200 ${
            hasValue ? "text-white" : "text-gray-400"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-3xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`px-6 py-4 cursor-pointer first:rounded-t-3xl last:rounded-b-3xl transition-colors flex items-center gap-3 ${
                value === option.value
                  ? "bg-black text-white hover:bg-gray-900"
                  : "text-black hover:bg-gray-200"
              }`}
            >
              {/* Metro Icon */}
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-600">
                M
              </div>
              {/* Station Name */}
              <span className="font-medium">{option.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1 ml-6">{error}</p>}
    </div>
  );
};
