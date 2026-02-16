"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import EnhancedPropertyCard from "@/app/components/EnhancedPropertyCard";
import PropertyCardSkeleton from "@/entities/property/ui/PropertyCardSkeleton";
import { selectUser } from "@/app/store/slices/authSlice";

interface MatchedProperty {
  property: any; // Property type
  matchScore: number;
  matchCategories?: any[]; // Category breakdown from backend
}

interface MatchedPropertyGridWithLoaderProps {
  matchedProperties: MatchedProperty[];
  loading?: boolean;
  onPropertyClick?: (property: any) => void;
  showShortlist?: boolean;
  className?: string;
  skeletonCount?: number;
  userPreferences?: any;
}

export default function MatchedPropertyGridWithLoader({
  matchedProperties,
  loading = false,
  onPropertyClick,
  showShortlist = true,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
  skeletonCount = 6,
  userPreferences,
}: MatchedPropertyGridWithLoaderProps) {
  const user = useSelector(selectUser);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  // Update image loading state when properties change (preserve loaded states for existing properties)
  useEffect(() => {
    if (matchedProperties.length > 0) {
      // Only remove loaded states for properties that are no longer in the list
      setImagesLoaded((prev) => {
        const currentPropertyIds = new Set(
          matchedProperties.map((p) => p.property.id)
        );
        const filteredLoaded: { [key: string]: boolean } = {};

        // Keep loaded states for properties that still exist
        Object.keys(prev).forEach((propertyId) => {
          if (currentPropertyIds.has(propertyId)) {
            filteredLoaded[propertyId] = prev[propertyId];
          }
        });

        return filteredLoaded;
      });
      setAllImagesLoaded(false);
    } else {
      // No properties, clear all loaded states
      setImagesLoaded({});
      setAllImagesLoaded(true);
    }
  }, [matchedProperties]);

  // Check if all images are loaded
  useEffect(() => {
    if (matchedProperties.length === 0) {
      setAllImagesLoaded(true);
      return;
    }

    const loadedCount = Object.keys(imagesLoaded).filter(
      (id) => imagesLoaded[id]
    ).length;

    if (loadedCount === matchedProperties.length) {
      setAllImagesLoaded(true);
    }
  }, [imagesLoaded, matchedProperties.length]);

  const handleImageLoad = (propertyId: string) => {
    setImagesLoaded((prev) => ({
      ...prev,
      [propertyId]: true,
    }));
  };

  // Show skeleton loading state
  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <PropertyCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (matchedProperties.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {matchedProperties.map((match) => (
        <EnhancedPropertyCard
          key={match.property.id}
          property={match.property}
          matchScore={match.matchScore}
          matchCategories={match.matchCategories || (match as any).categories}
          userPreferences={userPreferences}
          onClick={() => onPropertyClick?.(match.property)}
          showShortlist={showShortlist && (user?.role === "tenant" || user?.role === "admin")}
          imageLoaded={
            allImagesLoaded || imagesLoaded[match.property.id] || false
          }
          onImageLoad={() => handleImageLoad(match.property.id)}
        />
      ))}
    </div>
  );
}
