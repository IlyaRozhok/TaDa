import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface MultiSelectDropdownProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  value = [],
  onChange,
  options,
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

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const displayValue = value.length > 0 ? value.join(", ") : "";
  const hasValue = value.length > 0;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <div
          onClick={handleToggle}
          className={`w-full bg-white px-6 pt-8 pb-4 pr-6 rounded-3xl cursor-pointer flex items-center justify-between border-0} ${
            isInitialized ? "transition-all duration-200" : ""
          }`}
        >
          <span
            className={hasValue ? "text-black font-medium" : "text-transparent"}
          >
            {displayValue}
          </span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              hasValue ? "text-gray-500" : "text-gray-400"
            } ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
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
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-3xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => handleOptionClick(option)}
                className={`px-6 py-4 cursor-pointer first:rounded-t-3xl last:rounded-b-3xl transition-colors ${
                  value.includes(option)
                    ? "bg-black text-white hover:bg-gray-900"
                    : "text-black hover:bg-gray-200"
                }`}
              >
                <span className="font-medium">{option}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
