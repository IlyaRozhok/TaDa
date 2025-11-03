import React from "react";

interface StepWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const StepWrapper: React.FC<StepWrapperProps> = ({
  title,
  description,
  children,
  className = "",
}) => {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-4xl font-bold text-black mb-4">{title}</h1>
      <p className="text-gray-500 mb-6">{description}</p>
      {children}
    </div>
  );
};
