"use client";

import React from "react";

export interface SingleSelectOption {
  value: string;
  /** Row content — plain text or richer nodes (operator display name). */
  content: React.ReactNode;
  selected: boolean;
  /** Extra row class (pet type rows add `capitalize`). */
  className?: string;
}

interface SingleSelectDropdownProps {
  /** Key inside the parent-managed single-slot `openDropdown` state. */
  name: string;
  openDropdown: string | null;
  onToggleDropdown: (name: string) => void;
  /**
   * Blocks opening and hides the panel — the operator dropdown while its
   * list is loading. Omit for always-active dropdowns.
   */
  disabled?: boolean;
  /** Focus-ring classes on the toggle; the pet dropdowns differ per form. */
  focusRing?: boolean;
  /**
   * The property forms' inheritance lock, mirroring MultiSelectDropdown:
   * passing a boolean switches the toggle to the property template with the
   * cursor/opacity pair at the end, and when true it hides the caret and
   * the panel and ignores toggle clicks. Omit for the building template.
   */
  readonly?: boolean;
  /** Toggle text content — computed by the caller (display-name logic). */
  display: React.ReactNode;
  displayClassName: string;
  options: SingleSelectOption[];
  /** The caller owns the state write and closes the dropdown itself. */
  onSelect: (value: string) => void;
}

const TOGGLE_STATIC =
  "w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between";

const toggleClass = (focusRing: boolean, readonly: boolean | undefined) => {
  if (readonly === undefined) {
    return TOGGLE_STATIC;
  }
  return `w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg ${
    focusRing
      ? "focus:ring-2 focus:ring-white/50 focus:border-white/40 "
      : ""
  }text-white min-h-[40px] flex items-center justify-between ${
    readonly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
  }`;
};

export const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  name,
  openDropdown,
  onToggleDropdown,
  disabled = false,
  focusRing = true,
  readonly,
  display,
  displayClassName,
  options,
  onSelect,
}) => {
  return (
    <div className="relative" data-dropdown>
      <div
        className={toggleClass(focusRing, readonly)}
        onClick={() => !disabled && !readonly && onToggleDropdown(name)}
      >
        <span className={displayClassName}>{display}</span>
        {!readonly && (
          <svg
            className="w-5 h-5 text-white/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>
      {!disabled && !readonly && openDropdown === name && (
        <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white${
                option.className ? ` ${option.className}` : ""
              } ${option.selected ? "bg-white/10" : ""}`}
              onClick={() => onSelect(option.value)}
            >
              {option.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
