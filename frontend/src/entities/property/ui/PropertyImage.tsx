import React, { useEffect, useState, useRef } from "react";
import FeaturedBadge from "@/shared/ui/Badge/FeaturedBadge";
import { Property, PropertyMedia } from "@/app/types";
import { PROPERTY_PLACEHOLDER } from "@/app/utils/placeholders";
import { MatchBadgeTooltip } from "@/entities/property/ui/MatchBadgeTooltip";

interface PropertyImageProps {
  property: Property;
  imageLoaded: boolean;
  onImageLoad?: () => void;
  showFeaturedBadge?: boolean;
  matchScore?: number;
  matchCategories?: any[];
  isAuthenticated?: boolean;
}

const LAZY_ROOT_MARGIN = "200px";

export const PropertyImage: React.FC<PropertyImageProps> = ({
  property,
  imageLoaded,
  onImageLoad,
  showFeaturedBadge = false,
  matchScore,
  matchCategories,
  isAuthenticated = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getOptimizedMediaUrl = (media: PropertyMedia) => {
    // Prefer backend-provided thumbnails/mediums when available
    if (media.thumbnail_url) return media.thumbnail_url;
    if (media.medium_url) return media.medium_url;
    // Fallback to main URL (current behaviour)
    return media.url;
  };

  const getMainImage = () => {
    if (property.media && property.media.length > 0) {
      const featuredImage = property.media?.[0];
      return featuredImage ? getOptimizedMediaUrl(featuredImage) : getOptimizedMediaUrl(property.media[0]);
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

  // Lazy-load: only set image src when card is in or near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsInView(true);
        }
      },
      { rootMargin: LAZY_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const effectiveImageUrl =
    isInView ? (hasError && !isLoaded ? PROPERTY_PLACEHOLDER : displayImageUrl) : PROPERTY_PLACEHOLDER;

  return (
    <div
      ref={containerRef}
      className="relative aspect-[16/10] min-h-[9rem] rounded-xl overflow-hidden bg-slate-200/80"
    >
      {/* Featured Badge */}
      {showFeaturedBadge && <FeaturedBadge />}

      <MatchBadgeTooltip
        matchScore={matchScore}
        matchCategories={matchCategories}
      />

      <img
        src={effectiveImageUrl}
        alt={property.title}
        className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
          imageLoaded || isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />

      {/* Image skeleton when not loaded (lazy or loading) */}
      {!imageLoaded && !isLoaded && (
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slideIn_1.5s_infinite]" />
          {/* Skeleton blocks */}
          <div className="absolute inset-0 flex flex-col justify-end gap-2 p-3">
            <div className="h-8 w-3/4 max-w-[12rem] bg-slate-300/70 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 max-w-[8rem] bg-slate-300/60 rounded animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};
