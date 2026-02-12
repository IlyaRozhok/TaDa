import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface OptionGroup {
  label: string;
  options: string[];
}

interface MultiSelectDropdownProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  /** Flat list of options (use when no grouping) */
  options?: string[];
  /** Grouped options (when provided, used for rendering with section headers; options derived from this) */
  optionGroups?: OptionGroup[];
  placeholder?: string;
  /** Show search input and filter options by query */
  searchable?: boolean;
  /** Open dropdown upward (above the trigger) instead of downward */
  openUpward?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  value = [],
  onChange,
  options: optionsProp,
  optionGroups,
  placeholder,
  searchable = false,
  openUpward = false,
}) => {
  const options = optionGroups
    ? [...new Set(optionGroups.flatMap((g) => g.options))]
    : optionsProp ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const q = searchQuery.trim().toLowerCase();
  const filteredOptions = q
    ? options.filter((opt) => opt.toLowerCase().includes(q))
    : options;
  const filteredOptionGroups =
    optionGroups && q
      ? optionGroups
          .map((g) => ({
            label: g.label,
            options: g.options.filter((opt) => opt.toLowerCase().includes(q)),
          }))
          .filter((g) => g.options.length > 0)
      : optionGroups ?? [];

  const displayOptions = optionGroups ? undefined : filteredOptions;
  const displayOptionGroups = optionGroups ? filteredOptionGroups : undefined;

  // Close dropdown when clicking outside; reset search when closed
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Initialize component to enable animations after first render
  useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (searchable && isOpen && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchable, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setSearchQuery("");
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
          className={`relative w-full px-6 pt-8 pb-4 pr-12 rounded-4xl cursor-pointer flex items-center bg-gray-50 sm:bg-white border-0 h-[4.5rem] overflow-hidden ${
            isInitialized ? "transition-all duration-200" : ""
          }`}
        >
          {hasValue && (
            <span className="text-gray-900 font-medium truncate whitespace-nowrap pr-2">
              {displayValue}
            </span>
          )}
          <ChevronDown
            className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-transform text-gray-400 flex-shrink-0 ${
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
        {/* Glassmorphism Dropdown - opens upward on mobile, downward on desktop */}
        {isOpen && (
          <div
            className={`absolute left-0 right-0 z-50 rounded-3xl max-h-72 overflow-hidden backdrop-blur-[3px] ${
              openUpward
                ? "bottom-full mb-2"
                : "bottom-full sm:top-full sm:bottom-auto mb-2 sm:mt-2 sm:mb-0"
            }`}
          >
            <div
              className="relative rounded-3xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
                boxShadow:
                  "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="relative z-10 max-h-72 overflow-y-auto">
                {searchable && (
                  <div
                    className="sticky top-0 z-10 p-2 bg-black/30 backdrop-blur-sm border-b border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                      <Search className="w-4 h-4 text-white/70 flex-shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Search..."
                        className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/50 text-base outline-none"
                      />
                    </div>
                  </div>
                )}
                {displayOptionGroups ? (
                  displayOptionGroups.length > 0 ? (
                    displayOptionGroups.map((group) => (
                      <div key={group.label}>
                        <div className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 sticky top-0 bg-black/20 backdrop-blur-sm">
                          {group.label}
                        </div>
                        {group.options.map((option) => {
                          const isSelected = value.includes(option);
                          return (
                            <div
                              key={option}
                              onClick={() => handleOptionClick(option)}
                              className={`px-5 py-3 min-h-[3rem] cursor-pointer transition-all duration-200 flex items-center justify-between pl-7 ${
                                isSelected
                                  ? "bg-white/18 text-white"
                                  : "text-white hover:bg-white/12"
                              }`}
                              style={{
                                backdropFilter: isSelected
                                  ? "blur(10px)"
                                  : undefined,
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
                    ))
                  ) : (
                    <div className="px-5 py-4 text-sm text-white/60">
                      No matches
                    </div>
                  )
                ) : displayOptions && displayOptions.length > 0 ? (
                  displayOptions.map((option) => {
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
                  })
                ) : (
                  <div className="px-5 py-4 text-sm text-white/60">
                    No matches
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
