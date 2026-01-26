import React from "react";

interface StepContainerProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const StepContainer: React.FC<StepContainerProps> = ({
  children,
  className = "",
  compact = false,
}) => {
  return (
    <div className={`text-left ${className}`}>
      <div className={`bg-white sm:bg-gray-50 rounded-3xl ${compact ? "p-0 sm:p-6" : "p-0 sm:p-8"}`}>{children}</div>
    </div>
  );
};
