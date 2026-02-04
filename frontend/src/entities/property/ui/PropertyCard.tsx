"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Property } from "@/app/types";
import { PropertyImage } from "@/entities/property/ui/PropertyImage";
import { PropertyContent } from "@/entities/property/ui/PropertyContent";
import { PropertyBadges } from "@/entities/property/ui/PropertyBadges";
import { ShortlistToggleButton } from "@/features/shortlist/ui";

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  hasTopRightBadge?: boolean; // Legacy prop for compatibility
  showFeaturedBadge?: boolean; // Show featured badge on bottom right
  // Enhanced features
  matchScore?: number;
  matchCategories?: any[]; // Category breakdown from backend
  userPreferences?: any;
  isAuthenticated?: boolean;
  variant?: "default" | "homepage" | "enhanced"; // Different visual variants
}

export default function PropertyCard({
  property,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
  hasTopRightBadge = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  showFeaturedBadge = false,
  matchScore,
  matchCategories,
  userPreferences, // eslint-disable-line @typescript-eslint/no-unused-vars
  isAuthenticated = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  variant = "default",
}: PropertyCardProps) {
  const router = useRouter();
  const [shortlistSuccess, setShortlistSuccess] = useState<string | null>(null);
  const [shortlistError, setShortlistError] = useState<string | null>(null);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/app/properties/${property.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative">
        <PropertyImage
          property={property}
          imageLoaded={imageLoaded}
          onImageLoad={onImageLoad}
          showFeaturedBadge={showFeaturedBadge}
        />

        {/* Shortlist Button */}
        <ShortlistToggleButton
          property={property}
          showShortlist={showShortlist}
          onStatusChange={({ success, error }) => {
            setShortlistSuccess(success);
            setShortlistError(error);
          }}
        />

        <PropertyBadges property={property} />
      </div>

      {/* Content Section */}
      <PropertyContent
        property={property}
        shortlistSuccess={shortlistSuccess}
        shortlistError={shortlistError}
        matchScore={matchScore}
        matchCategories={matchCategories}
      />
    </div>
  );
}
