import React, { useState, useEffect } from "react";
import Image from "next/image";
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
  const [imgSrc, setImgSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  const getMainImage = () => {
    if (property.media && property.media.length > 0) {
      const featuredImage = property.media?.[0];
      return featuredImage ? featuredImage.url : property.media[0].url;
    }
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    return PROPERTY_PLACEHOLDER;
  };

  const imageUrl = imgSrc || getMainImage();

  useEffect(() => {
    // Reset error state when property changes
    setHasError(false);
    setImgSrc("");
  }, [property.id]);

  return (
    <div className="relative h-48 bg-slate-100">
      {/* Featured Badge */}
      {showFeaturedBadge && <FeaturedBadge />}

      {hasError ? (
        <img
          src={PROPERTY_PLACEHOLDER}
          alt={property.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            if (onImageLoad) {
              onImageLoad();
            }
          }}
        />
      ) : (
        <Image
          src={imageUrl}
          alt={property.title}
          width={800}
          height={400}
          quality={100}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            if (onImageLoad) {
              onImageLoad();
            }
          }}
          onError={() => {
            setHasError(true);
            if (onImageLoad) {
              onImageLoad();
            }
          }}
        />
      )}

      {/* Loading overlay when image is not loaded */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slideIn_1.5s_infinite]"></div>
        </div>
      )}
    </div>
  );
};
