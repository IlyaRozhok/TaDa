import React from "react";
import { GlassmorphismDropdown, DropdownOption } from "./GlassmorphismDropdown";

interface LocationOption {
  value: string;
  label: string;
}

interface LocationDropdownProps {
  label: string;
  value: string;
  options: readonly LocationOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "",
  error,
}) => {
  const mappedOptions: DropdownOption[] = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <GlassmorphismDropdown
      label={label}
      value={value}
      options={mappedOptions}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      // No icon for location dropdown
      noPreferenceValue=""
    />
  );
};
