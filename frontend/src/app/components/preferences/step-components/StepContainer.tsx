import React from "react";

interface StepContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const StepContainer: React.FC<StepContainerProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`text-left ${className}`}>
      <div className="bg-gray-50 rounded-lg p-8">{children}</div>
    </div>
  );
};
