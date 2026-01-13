import React from "react";

interface StepHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  title,
  subtitle,
  className = "",
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <h2 className="text-2xl font-semibold text-black mb-1 text-left">
        {title}
      </h2>
      {subtitle && <p className="text-blue-500 text-sm">{subtitle}</p>}
    </div>
  );
};
