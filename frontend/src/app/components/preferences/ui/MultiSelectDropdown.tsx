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
  placeholder,
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
          className={`relative w-full bg-black/30 backdrop-blur-lg px-6 pt-8 pb-4 pr-12 rounded-3xl cursor-pointer flex items-center justify-between ${
            isInitialized ? "transition-all duration-200" : ""
          } ${isOpen ? "bg-black/40" : "hover:bg-black/35"}`}
        >
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/20 backdrop-blur-lg rounded-3xl -z-10"></div>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-md rounded-3xl -z-10"></div>

          {hasValue ? (
            <span className="relative z-10 text-white font-medium">
              {displayValue}
            </span>
          ) : (
            <span className="relative z-10 text-white/60">
              {placeholder || `Select ${label.toLowerCase()}`}
            </span>
          )}
          <ChevronDown
            className={`relative z-10 w-5 h-5 transition-transform text-white/80 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
        <label
          className={`absolute left-6 pointer-events-none z-20 ${
            isInitialized ? "transition-all duration-200" : ""
          } ${
            hasValue || isOpen
              ? "top-3 text-xs text-white/70"
              : "top-1/2 -translate-y-1/2 text-base text-white/60"
          }`}
        >
          {label}
        </label>
        {/* Glassmorphism Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-3xl max-h-60 overflow-hidden">
            <div className="relative bg-black/30 backdrop-blur-lg rounded-3xl">
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/20 backdrop-blur-lg rounded-3xl -z-10"></div>
              <div className="absolute inset-0 bg-black/20 backdrop-blur-md rounded-3xl -z-10"></div>

              <div className="relative z-10 max-h-60 overflow-y-auto">
                {options.map((option) => {
                  const isSelected = value.includes(option);
                  return (
                    <div
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className={`px-6 py-4 cursor-pointer first:rounded-t-3xl last:rounded-b-3xl transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 flex-shrink-0 ml-3 stroke-[3] text-white" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
