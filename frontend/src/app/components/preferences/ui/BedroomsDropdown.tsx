import React from "react";
import { Bed } from "lucide-react";
import { GlassmorphismDropdown, DropdownOption } from "./GlassmorphismDropdown";

interface BedroomsDropdownProps {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  placeholder?: string;
  error?: string;
  min?: boolean; // true for min_bedrooms, false for max_bedrooms
}

export const BedroomsDropdown: React.FC<BedroomsDropdownProps> = ({
  label,
  value,
  onChange,
  placeholder = "No Preference",
  error,
  min = true,
}) => {
  const options: DropdownOption[] = [
    { value: "", label: "No Preference" },
    ...Array.from({ length: 5 }, (_, i) => i + 1).map((num) => ({
      value: num,
      label: `${num} bedroom${num > 1 ? "s" : ""}`,
    })),
  ];

  return (
    <GlassmorphismDropdown
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      icon={<Bed className="w-5 h-5 text-white" />}
      noPreferenceValue=""
    />
  );
};
