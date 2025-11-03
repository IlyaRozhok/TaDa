"use client";

import React from "react";

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Loading text */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Switching Experience
        </h3>
        <p className="text-gray-600 mb-4">
          Loading your personalized content...
        </p>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gray-900 to-gray-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
