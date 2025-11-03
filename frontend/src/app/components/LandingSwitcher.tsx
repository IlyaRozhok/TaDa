"use client";

import React, { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { generalKeys } from "../lib/translationsKeys/generalKeys";

export type LandingType = "operators" | "tenants";

interface LandingSwitcherProps {
  currentType: LandingType;
  onSwitch: (type: LandingType) => void;
  isLoading?: boolean;
}

const LandingSwitcher: React.FC<LandingSwitcherProps> = ({
  currentType,
  onSwitch,
  isLoading = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useTranslation();

  const handleSwitch = (newType: LandingType) => {
    if (newType === currentType || isLoading) return;

    setIsAnimating(true);
    setTimeout(() => {
      onSwitch(newType);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="w-full flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-full p-1 relative">
      {/* Background slider */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-2px)] sm:w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out ${
          currentType === "operators" ? "left-1" : "right-1"
        } ${isAnimating ? "scale-95" : "scale-100"}`}
      />

      {/* Operators button */}
      <button
        onClick={() => handleSwitch("operators")}
        disabled={isLoading}
        className={`relative z-10 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex-1 ${
          currentType === "operators"
            ? "text-gray-900"
            : "text-gray-600 hover:text-gray-800"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="hidden sm:inline cursor-pointer">
          {t(generalKeys.switchMode.operators)}
        </span>
        <span className="sm:hidden cursor-pointer">
          {t(generalKeys.switchMode.operators)}
        </span>
      </button>

      {/* Tenants button */}
      <button
        onClick={() => handleSwitch("tenants")}
        disabled={isLoading}
        className={`relative z-10 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex-1 ${
          currentType === "tenants"
            ? "text-gray-900"
            : "text-gray-600 hover:text-gray-800"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="hidden sm:inline cursor-pointer">
          {" "}
          {t(generalKeys.switchMode.tenants)}
        </span>
        <span className="sm:hidden cursor-pointer">
          {" "}
          {t(generalKeys.switchMode.tenants)}
        </span>
      </button>
    </div>
  );
};

export default LandingSwitcher;
