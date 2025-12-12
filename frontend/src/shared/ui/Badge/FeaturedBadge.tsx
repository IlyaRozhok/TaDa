"use client";

import React from "react";

interface FeaturedBadgeProps {
  className?: string;
}

export default function FeaturedBadge({ className = "" }: FeaturedBadgeProps) {
  return (
    <div className={`absolute bottom-4 right-4 z-10 ${className}`}>
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
        ⭐ Featured
      </div>
    </div>
  );
}
