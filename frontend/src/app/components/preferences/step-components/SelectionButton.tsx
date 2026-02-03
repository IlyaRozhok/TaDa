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
  icon: Icon,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-full h-full min-h-[3rem] sm:min-h-[3.5rem] pl-4 sm:pl-6 py-6 sm:p-4 text-left rounded-3xl border-0 transition-colors flex items-center justify-between ${
        isSelected
          ? "bg-black text-white cursor-pointer"
          : "bg-gray-50 sm:bg-white text-black hover:bg-gray-200 cursor-pointer"
      } ${className}`}
    >
      <div className="flex items-center flex-1 min-w-0 pr-2">
        {Icon && (
          <div className="text-2xl mr-2 sm:mr-3 flex-shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
        <span className="font-medium text-[13px] sm:text-base break-words leading-tight">
          {label}
        </span>
      </div>
      <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ml-1 flex items-center justify-center">
        {isSelected && (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
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
