import React from "react";
import { Info } from "lucide-react";

interface RequiredLabelProps {
  children: React.ReactNode;
  required?: boolean;
  tooltip?: string;
}

export const RequiredLabel: React.FC<RequiredLabelProps> = ({
  children,
  required = false,
  tooltip,
}) => (
  <div className="flex items-center gap-2 mb-2">
    <label className="block text-sm font-semibold text-slate-900">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {tooltip && (
      <div className="group relative">
        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
          {tooltip}
        </div>
      </div>
    )}
  </div>
);
