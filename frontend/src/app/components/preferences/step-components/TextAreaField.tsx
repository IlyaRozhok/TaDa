import React from "react";

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  className = "",
}) => {
  return (
    <div className={`text-left ${className}`}>
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-black mb-8 text-left">
          {label}
        </h2>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full p-4 border-0 rounded-3xl text-gray-700 placeholder-gray-400 bg-white resize-none shadow-sm"
        />
      </div>
    </div>
  );
};
