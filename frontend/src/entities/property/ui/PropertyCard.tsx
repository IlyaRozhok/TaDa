"use client";

import React from "react";
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
  /** When true, shortlist heart is shown for any role (e.g. admin on units page). */
  showShortlistForAllRoles?: boolean;
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
  isAuthenticated: isAuthenticatedProp,
  variant = "default",
  showShortlistForAllRoles = false,
}: PropertyCardProps) {
  const router = useRouter();

  // Default isAuthenticated based on matchScore presence (include 0% so badge shows when no preferences)
  const isAuthenticated = isAuthenticatedProp ?? (matchScore !== undefined);

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
      className="w-full min-w-0 rounded-xl transition-all duration-200 cursor-pointer group overflow-visible"
    >
      {/* Image Section */}
      <div className="relative overflow-visible rounded-xl">
        <div className="overflow-hidden rounded-xl">
          <PropertyImage
            property={property}
            imageLoaded={imageLoaded}
            onImageLoad={onImageLoad}
            showFeaturedBadge={showFeaturedBadge}
            matchScore={matchScore}
            matchCategories={matchCategories}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Shortlist Button */}
        <ShortlistToggleButton
          property={property}
          showShortlist={showShortlist}
          showForAllRoles={showShortlistForAllRoles}
        />

        <PropertyBadges property={property} />
      </div>

      {/* Content Section */}
      <PropertyContent
        property={property}
        matchScore={matchScore}
        matchCategories={matchCategories}
      />
    </div>
  );
}
