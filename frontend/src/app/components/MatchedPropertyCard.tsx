"use client";

import React from "react";
import PropertyCard from "./PropertyCard";
import { Property } from "../types";

interface MatchedPropertyCardProps {
  property: Property;
  matchScore: number;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
}

export default function MatchedPropertyCard({
  property,
  matchScore,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
}: MatchedPropertyCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200 text-green-700";
    if (score >= 60) return "bg-blue-50 border-blue-200 text-blue-700";
    if (score >= 40) return "bg-yellow-50 border-yellow-200 text-yellow-700";
    return "bg-gray-50 border-gray-200 text-gray-700";
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

      {/* Match Score Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-200 ${getScoreColor(
            matchScore
          )}`}
        >
          {Math.round(matchScore)}% Match
        </div>
      </div>
    </div>
  );
}
