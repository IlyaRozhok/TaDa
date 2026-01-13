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
        {/* White Input */}
        <div
          onClick={handleToggle}
          className={`relative w-full px-6 pt-8 pb-4 pr-12 rounded-3xl cursor-pointer flex items-center bg-white border-0 h-[4.5rem] ${
            isInitialized ? "transition-all duration-200" : ""
          }`}
        >
          {hasValue && (
            <span className="text-gray-900 font-medium">{displayValue}</span>
          )}
          <ChevronDown
            className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-transform text-gray-400 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
        <label
          className={`absolute left-6 pointer-events-none z-20 ${
            isInitialized ? "transition-all duration-200" : ""
          } ${
            hasValue || isOpen
              ? "top-3 text-xs text-gray-500"
              : "top-1/2 -translate-y-1/2 text-base text-gray-400"
          }`}
        >
          {label}
        </label>
        {/* Glassmorphism Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-3xl max-h-60 overflow-hidden backdrop-blur-[3px]">
            <div
              className="relative rounded-3xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
                boxShadow:
                  "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="relative z-10 max-h-60 overflow-y-auto">
                {options.map((option) => {
                  const isSelected = value.includes(option);
                  return (
                    <div
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className={`px-5 py-3 min-h-[3rem] cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? "bg-white/18 text-white"
                          : "text-white hover:bg-white/12"
                      }`}
                      style={{
                        backdropFilter: isSelected ? "blur(10px)" : undefined,
                      }}
                    >
                      <span
                        className="font-semibold"
                        style={{ fontWeight: 600 }}
                      >
                        {option}
                      </span>
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
