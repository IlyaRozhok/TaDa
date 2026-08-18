"use client";

import React from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
  /**
   * When defined, the row renders the disabled-aware class template the
   * children dropdown used; when undefined, the plain row template. This
   * keeps the emitted class strings exactly as they were in the monoliths.
   */
  disabled?: boolean;
}

export interface MultiSelectGroup {
  title: string;
  options: MultiSelectOption[];
}

interface MultiSelectDropdownProps {
  /** Key inside the parent-managed single-slot `openDropdown` state. */
  name: string;
  values: string[];
  /** Flat option list; ignored when `groups` is given. */
  options?: MultiSelectOption[];
  /** Categorized options with sticky headers (the amenities shape). */
  groups?: MultiSelectGroup[];
  placeholder: string;
  openDropdown: string | null;
  onToggleDropdown: (name: string) => void;
  /** A click on an option row; the caller owns the next-selection logic. */
  onOptionClick: (value: string) => void;
  /** The × on a chip; the caller owns the removal logic. */
  onChipRemove: (value: string) => void;
  /**
   * The monoliths were inconsistent: some toggles carried focus-ring
   * classes, some did not. Kept per call site so the markup is unchanged.
   */
  focusRing?: boolean;
  /**
   * The property forms' inheritance lock. Passing a boolean (even false)
   * switches the toggle to the property template — the class order the
   * property monolith used, with the cursor/opacity pair at the end — and
   * when true it hides the chip ×, the caret and the options panel and
   * ignores toggle clicks, exactly as the "(from building)" lock did.
   * Omit entirely for the building forms' static templates.
   */
  readonly?: boolean;
  /**
   * The locked-state classes of the property template. The amenities
   * dropdowns lock softer (`cursor-default opacity-80`) than the tenant
   * targeting ones — kept per call site.
   */
  readonlyClassName?: string;
  /** Chip label override (amenities translate the stored label). */
  getChipLabel?: (value: string) => React.ReactNode;
  toggleTestId?: string;
  optionsTestId?: string;
}

const TOGGLE_WITH_FOCUS =
  "w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center";
const TOGGLE_WITHOUT_FOCUS =
  "w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white cursor-pointer min-h-[40px] flex items-center";

const toggleClass = (
  focusRing: boolean,
  readonly: boolean | undefined,
  readonlyClassName: string,
) => {
  if (readonly === undefined) {
    return focusRing ? TOGGLE_WITH_FOCUS : TOGGLE_WITHOUT_FOCUS;
  }
  return `w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg ${
    focusRing
      ? "focus:ring-2 focus:ring-white/50 focus:border-white/40 "
      : ""
  }text-white min-h-[40px] flex items-center ${
    readonly ? readonlyClassName : "cursor-pointer"
  }`;
};

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  name,
  values,
  options,
  groups,
  placeholder,
  openDropdown,
  onToggleDropdown,
  onOptionClick,
  onChipRemove,
  focusRing = true,
  readonly,
  readonlyClassName = "opacity-60 cursor-not-allowed",
  getChipLabel,
  toggleTestId,
  optionsTestId,
}) => {
  const flatOptions = groups ? groups.flatMap((g) => g.options) : (options ?? []);

  const labelFor = (value: string): React.ReactNode => {
    if (getChipLabel) return getChipLabel(value);
    const option = flatOptions.find((o) => o.value === value);
    return option?.label ?? value;
  };

  const renderOption = (option: MultiSelectOption) => (
    <div
      key={option.value}
      className={
        option.disabled === undefined
          ? "px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
          : `px-4 py-2 text-white flex items-center space-x-2 ${
              option.disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-white/20 cursor-pointer"
            }`
      }
      onClick={() => {
        if (option.disabled) return;
        onOptionClick(option.value);
      }}
    >
      <input
        type="checkbox"
        checked={values.includes(option.value)}
        disabled={option.disabled}
        readOnly
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>{option.label}</span>
    </div>
  );

  return (
    <div className="relative" data-dropdown>
      <div
        data-testid={toggleTestId}
        className={toggleClass(focusRing, readonly, readonlyClassName)}
        onClick={() => !readonly && onToggleDropdown(name)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {values.length > 0 ? (
            values.map((value) => (
              <span
                key={value}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
              >
                {labelFor(value)}
                {!readonly && (
                  <button
                    type="button"
                    className="ml-1 text-white/70 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChipRemove(value);
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-white/50">{placeholder}</span>
          )}
        </div>
        {!readonly && (
          <svg
            className="w-5 h-5 text-white/70 ml-2"
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
      {!readonly && openDropdown === name && (
        <div
          data-testid={optionsTestId}
          className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {groups
            ? groups.map((group) => (
                <div key={group.title}>
                  <div className="px-4 py-2 text-xs font-semibold text-white/70 border-b border-white/10 sticky top-0 bg-gray-900/95">
                    {group.title}
                  </div>
                  {group.options.map(renderOption)}
                </div>
              ))
            : (options ?? []).map(renderOption)}
        </div>
      )}
    </div>
  );
};
