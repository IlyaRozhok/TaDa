"use client";

import React, { useState, useEffect } from "react";
import PropertyCard from "./PropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import { Property } from "../types";

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

  // Reset image loading state when properties change
  useEffect(() => {
    if (properties.length > 0) {
      setImagesLoaded({});
      setAllImagesLoaded(false);
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
