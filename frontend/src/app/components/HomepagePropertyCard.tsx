// DEPRECATED: Use PropertyCard from @/entities/property/ui instead
// This is a compatibility wrapper that will be removed in a future version

"use client";

import React from "react";
import PropertyCard from "@/entities/property/ui/PropertyCard";
import { Property } from "../types";

interface HomepagePropertyCardProps {
  property: Property;
  matchScore: number;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  isAuthenticated?: boolean;
}

export default function HomepagePropertyCard({
  property,
  matchScore,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
  isAuthenticated = false,
}: HomepagePropertyCardProps) {
  return (
    <PropertyCard
      property={property}
      matchScore={matchScore}
      onClick={onClick}
      showShortlist={showShortlist}
      imageLoaded={imageLoaded}
      onImageLoad={onImageLoad}
      isAuthenticated={isAuthenticated}
      variant="homepage"
    />
  );
}