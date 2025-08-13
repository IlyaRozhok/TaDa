"use client";

import React, { useState, useEffect } from "react";
import MatchedPropertyCard from "./MatchedPropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";

interface MatchedProperty {
  property: any; // Property type
  matchScore: number;
}

interface MatchedPropertyGridWithLoaderProps {
  matchedProperties: MatchedProperty[];
  loading?: boolean;
  onPropertyClick?: (property: any) => void;
  showShortlist?: boolean;
  className?: string;
  skeletonCount?: number;
}

export default function MatchedPropertyGridWithLoader({
  matchedProperties,
  loading = false,
  onPropertyClick,
  showShortlist = true,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  skeletonCount = 6,
}: MatchedPropertyGridWithLoaderProps) {
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
        <MatchedPropertyCard
          key={match.property.id}
          property={match.property}
          matchScore={match.matchScore}
          onClick={() => onPropertyClick?.(match.property)}
          showShortlist={showShortlist}
          imageLoaded={
            allImagesLoaded || imagesLoaded[match.property.id] || false
          }
          onImageLoad={() => handleImageLoad(match.property.id)}
        />
      ))}
    </div>
  );
}
