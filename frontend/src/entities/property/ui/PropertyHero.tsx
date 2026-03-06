"use client";

import React from "react";
import ImageGallery from "@/app/components/ImageGallery";
import { Property } from "@/app/types";

interface PropertyHeroProps {
  property: Property;
  allImages: string[];
  onGalleryClick?: () => void;
}

export default function PropertyHero({
  property,
  allImages,
  onGalleryClick,
}: PropertyHeroProps) {
  return (
    <section>
      <div className="relative rounded-2xl overflow-hidden">
        <div className="rounded-2xl overflow-hidden">
          <ImageGallery
            media={property.media}
            images={property.images}
            alt={property.title}
          />
        </div>
        {allImages.length > 0 && (
          <button
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 text-sm font-semibold rounded-full px-4 py-2 shadow-lg"
            onClick={onGalleryClick}
          >
            See all photo ({allImages.length})
          </button>
        )}
      </div>
    </section>
  );
}
