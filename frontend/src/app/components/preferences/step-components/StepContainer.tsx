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
      <div className={`bg-gray-50 rounded-3xl ${compact ? "p-4 sm:p-6" : "p-8"}`}>{children}</div>
    </div>
  );
};
