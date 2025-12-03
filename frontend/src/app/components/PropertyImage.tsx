import React, { useState, useEffect } from "react";
import { Property } from "../types";
import { PROPERTY_PLACEHOLDER } from "../utils/placeholders";
import FeaturedBadge from "./ui/FeaturedBadge";

interface PropertyImageProps {
  property: Property;
  imageLoaded: boolean;
  onImageLoad?: () => void;
  showFeaturedBadge?: boolean;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({
  property,
  imageLoaded,
  onImageLoad,
  showFeaturedBadge = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const getMainImage = () => {
    if (property.media && property.media.length > 0) {
      const featuredImage = property.media?.[0];
      return featuredImage ? featuredImage.url : property.media[0].url;
    }
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    if (property.photos && property.photos.length > 0) {
      return property.photos[0];
    }
    return PROPERTY_PLACEHOLDER;
  };

  const mainImageUrl = getMainImage();
  const displayImageUrl = imageSrc || mainImageUrl;

  useEffect(() => {
    // Reset states when property changes
    setImageSrc("");
    setIsLoaded(false);
    setHasError(false);
  }, [property.id]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;

    // Only mark as loaded if it's a real image (not placeholder)
    if (
      currentSrc !== PROPERTY_PLACEHOLDER &&
      !currentSrc.includes("data:image/svg+xml") &&
      !currentSrc.includes("Property Image")
    ) {
      setIsLoaded(true);
      setHasError(false);
      // Store the successfully loaded image URL to prevent switching back to placeholder
      if (!imageSrc || imageSrc === PROPERTY_PLACEHOLDER) {
        setImageSrc(currentSrc);
      }
      if (onImageLoad) {
        onImageLoad();
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;

    // Never replace image if it was successfully loaded before
    if (isLoaded && imageSrc && imageSrc !== PROPERTY_PLACEHOLDER) {
      // Restore the successfully loaded image
      target.src = imageSrc;
      return;
    }

    // Only show placeholder if image hasn't been successfully loaded yet
    // and we're not trying to load placeholder itself
    if (
      !isLoaded &&
      currentSrc !== PROPERTY_PLACEHOLDER &&
      !currentSrc.includes("data:image/svg+xml") &&
      !currentSrc.includes("Property Image")
    ) {
      setHasError(true);
      // Prevent infinite loop - only set placeholder if not already set
      if (target.src !== PROPERTY_PLACEHOLDER) {
        target.src = PROPERTY_PLACEHOLDER;
      }
    }
    // Still call onImageLoad to hide skeleton even on error
    if (onImageLoad) {
      onImageLoad();
    }
  };

  return (
    <div className="relative h-48 bg-slate-100">
      {/* Featured Badge */}
      {showFeaturedBadge && <FeaturedBadge />}

      <img
        src={hasError && !isLoaded ? PROPERTY_PLACEHOLDER : displayImageUrl}
        alt={property.title}
        className={`w-full h-full object-cover group-hover:scale-105 transition-opacity duration-300 ${
          imageLoaded || isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />

      {/* Loading overlay when image is not loaded */}
      {!imageLoaded && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slideIn_1.5s_infinite]"></div>
        </div>
      )}
    </div>
  );
};
