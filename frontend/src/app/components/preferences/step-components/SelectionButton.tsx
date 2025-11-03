import React from "react";

interface SelectionButtonProps {
  label: string;
  value: string;
  isSelected: boolean;
  onClick: (value: string) => void;
  icon?: React.ComponentType<any>;
  className?: string;
}

export const SelectionButton: React.FC<SelectionButtonProps> = ({
  label,
  value,
  isSelected,
  onClick,
  icon,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
        isSelected
          ? "bg-black text-white"
          : "bg-white text-black hover:bg-gray-50"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && (
            <div className="text-2xl mr-3">
              <icon className="w-6 h-6" />
            </div>
          )}
          <span className="font-medium">{label}</span>
        </div>
        {isSelected && (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </button>
  );
};
