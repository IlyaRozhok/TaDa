"use client";

import React from "react";
import PropertyCard from "./PropertyCard";
import MatchTooltip from "./MatchTooltip";
import { Property } from "../types";

interface MatchedPropertyCardProps {
  property: Property;
  matchScore: number;
  userPreferences?: any;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
}

export default function MatchedPropertyCard({
  property,
  matchScore,
  userPreferences,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
}: MatchedPropertyCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-gray-800 text-white";
    if (score >= 60) return "bg-gray-700 text-white";
    if (score >= 40) return "bg-gray-600 text-white";
    return "bg-gray-500 text-white";
  };

  return (
    <div className="relative">
      <PropertyCard
        property={property}
        onClick={onClick}
        showShortlist={showShortlist}
        imageLoaded={imageLoaded}
        onImageLoad={onImageLoad}
        hasTopRightBadge={true}
        showFeaturedBadge={false}
      />

      {/* Match Score Badge with Tooltip */}
      <div className="absolute top-3 left-3 z-10">
        <MatchTooltip
          property={property}
          matchScore={matchScore}
          userPreferences={userPreferences}
        >
          <div
            className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer ${getScoreColor(
              matchScore
            )}`}
          >
            {Math.round(matchScore)}% Match
          </div>
        </MatchTooltip>
      </div>
    </div>
  );
}
