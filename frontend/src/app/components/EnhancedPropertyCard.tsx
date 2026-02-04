// DEPRECATED: Use PropertyCard from @/entities/property/ui instead
// This is a compatibility wrapper that will be removed in a future version

"use client";

import React from "react";
import PropertyCard from "@/entities/property/ui/PropertyCard";
import { Property } from "../types";
import { CategoryMatchResult } from "../lib/api";

interface EnhancedPropertyCardProps {
  property: Property;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  matchScore?: number;
  userPreferences?: any;
  matchCategories?: CategoryMatchResult[];
}

export default function EnhancedPropertyCard({
  property,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
  matchScore,
  userPreferences,
  matchCategories,
}: EnhancedPropertyCardProps) {
  return (
    <PropertyCard
      property={property}
      onClick={onClick}
      showShortlist={showShortlist}
      imageLoaded={imageLoaded}
      onImageLoad={onImageLoad}
      matchScore={matchScore}
      userPreferences={userPreferences}
      matchCategories={matchCategories}
      variant="enhanced"
    />
  );
}