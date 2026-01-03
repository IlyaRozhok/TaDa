import React from "react";
import { Sofa } from "lucide-react";
import { GlassmorphismDropdown, DropdownOption } from "./GlassmorphismDropdown";

interface FurnishingDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const FurnishingDropdown: React.FC<FurnishingDropdownProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select furnishing",
  error,
}) => {
  const options: DropdownOption[] = [
    { value: "furnished", label: "Furnished" },
    { value: "unfurnished", label: "Unfurnished" },
    { value: "part-furnished", label: "Part Furnished" },
  ];

  return (
    <GlassmorphismDropdown
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      icon={<Sofa className="w-5 h-5 text-white" />}
      noPreferenceValue=""
    />
  );
};
