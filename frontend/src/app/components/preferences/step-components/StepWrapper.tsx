import React from "react";

interface StepWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const StepWrapper: React.FC<StepWrapperProps> = ({
  title,
  description,
  children,
  className = "",
  compact = false,
}) => {
  return (
    <div className={`text-center ${className}`}>
      <h1 className={`${compact ? "text-xl sm:text-3xl" : "text-3xl sm:text-4xl"} font-bold text-black ${compact ? "mb-2 sm:mb-3" : "mb-4"}`}>{title}</h1>
      <p className={`text-gray-500 ${compact ? "text-sm sm:text-base mb-3 sm:mb-4" : "mb-6"}`}>{description}</p>
      {children}
    </div>
  );
};
