import React from "react";

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number" | "email" | "password";
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  min,
  max,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        min={min}
        max={max}
        value={value || ""}
        onChange={(e) => {
          const newValue =
            type === "number" ? Number(e.target.value) : e.target.value;
          onChange(newValue);
        }}
        className="w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm"
        placeholder=""
      />
      <label
        className={`absolute left-6 transition-all duration-200 pointer-events-none ${
          value
            ? "top-3 text-xs text-gray-500"
            : "top-1/2 translate-y-1 text-base text-gray-400"
        }`}
      >
        {label}
      </label>
    </div>
  );
};
