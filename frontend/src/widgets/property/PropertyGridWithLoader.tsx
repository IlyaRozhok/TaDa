"use client";

import React, { useEffect, useState } from "react";
import { Property } from "@/app/types";
import PropertyCard from "@/entities/property/ui/PropertyCard";
import PropertyCardSkeleton from "@/entities/property/ui/PropertyCardSkeleton";

interface PropertyGridWithLoaderProps {
  properties: Property[];
  loading?: boolean;
  onPropertyClick?: (property: Property) => void;
  showShortlist?: boolean;
  className?: string;
  skeletonCount?: number;
}

export default function PropertyGridWithLoader({
  properties,
  loading = false,
  onPropertyClick,
  showShortlist = true,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  skeletonCount = 6,
}: PropertyGridWithLoaderProps) {
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  // Update image loading state when properties change (preserve loaded states for existing properties)
  useEffect(() => {
    if (properties.length > 0) {
      // Only remove loaded states for properties that are no longer in the list
      setImagesLoaded((prev) => {
        const currentPropertyIds = new Set(properties.map((p) => p.id));
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
  }, [properties]);

  // Check if all images are loaded
  useEffect(() => {
    if (properties.length === 0) {
      setAllImagesLoaded(true);
      return;
    }

    const loadedCount = Object.keys(imagesLoaded).filter(
      (id) => imagesLoaded[id]
    ).length;

    if (loadedCount === properties.length) {
      setAllImagesLoaded(true);
    }
  }, [imagesLoaded, properties.length]);

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
  if (properties.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={() => onPropertyClick?.(property)}
          showShortlist={showShortlist}
          imageLoaded={allImagesLoaded || imagesLoaded[property.id] || false}
          onImageLoad={() => handleImageLoad(property.id)}
        />
      ))}
    </div>
  );
}
