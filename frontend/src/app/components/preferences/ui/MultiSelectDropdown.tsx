import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

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
        {/* Glassmorphism Input */}
        <div
          onClick={handleToggle}
          className={`w-full bg-white/80 backdrop-blur-md px-6 pt-8 pb-4 pr-6 rounded-3xl cursor-pointer flex items-center justify-between border border-gray-200/50 shadow-lg ${
            isInitialized ? "transition-all duration-200" : ""
          } ${isOpen ? "bg-white/90 border-gray-300/50 shadow-xl" : "hover:bg-white/90"}`}
        >
          <span
            className={hasValue ? "text-black font-medium" : "text-transparent"}
          >
            {displayValue}
          </span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              hasValue ? "text-gray-700" : "text-gray-500"
            } ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
        <label
          className={`absolute left-6 pointer-events-none ${
            isInitialized ? "transition-all duration-200" : ""
          } ${
            hasValue || isOpen
              ? "top-3 text-xs text-gray-600"
              : "top-1/2 -translate-y-1/2 text-base text-gray-500"
          }`}
        >
          {label}
        </label>
        {/* Glassmorphism Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = value.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  className={`px-6 py-4 cursor-pointer first:rounded-t-3xl last:rounded-b-3xl transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? "bg-black text-white hover:bg-gray-900"
                      : "text-black hover:bg-gray-100/50"
                  }`}
                >
                  <span className="font-medium">{option}</span>
                  {isSelected && (
                    <Check className="w-5 h-5 flex-shrink-0 ml-3 stroke-[3]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
