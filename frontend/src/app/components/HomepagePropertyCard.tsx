// DEPRECATED: Use PropertyCard from @/entities/property/ui instead
// This is a compatibility wrapper that will be removed in a future version

"use client";

import React from "react";
import PropertyCard from "@/entities/property/ui/PropertyCard";
import { Property } from "../types";

interface HomepagePropertyCardProps {
  property: Property;
  matchScore: number;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  isAuthenticated?: boolean;
}

export default function HomepagePropertyCard({
  property,
  matchScore,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
  isAuthenticated = false,
}: HomepagePropertyCardProps) {
  return (
    <PropertyCard
      property={property}
      matchScore={matchScore}
      onClick={onClick}
      showShortlist={showShortlist}
      imageLoaded={imageLoaded}
      onImageLoad={onImageLoad}
      isAuthenticated={isAuthenticated}
      variant="homepage"
    />
  );
}
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const shortlistProperties = useSelector(selectShortlistProperties);

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);
  const [shortlistSuccess, setShortlistSuccess] = useState<string | null>(null);

  // Check if property is in shortlist
  useEffect(() => {
    if (user && user.role === "tenant") {
      const isInShortlist = shortlistProperties.some(
        (shortlistProperty) => shortlistProperty.id === property.id
      );
      setIsShortlisted(isInShortlist);
    }
  }, [property.id, shortlistProperties, user]);

  // Simplified: no dynamic tooltip calculations

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

  const handleShortlistToggle = async () => {
    if (!user || user.role !== "tenant") return;

    if (isShortlisted) {
      await handleRemoveFromShortlist();
    } else {
      await handleAddToShortlist();
    }
  };

  const handleAddToShortlist = async () => {
    setShortlistError(null);
    setShortlistSuccess(null);
    try {
      setShortlistLoading(true);
      setIsShortlisted(true); // Optimistic update
      await dispatch(
        addToShortlist({ propertyId: property.id, property })
      ).unwrap();
      setShortlistSuccess("Property added to shortlist");
      setTimeout(() => {
        setShortlistSuccess(null);
      }, 3000);
    } catch (error: unknown) {
      console.error("Error adding to shortlist:", error);
      setIsShortlisted(false); // Revert optimistic update on error
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add to shortlist";
      setShortlistError(errorMessage);
      setTimeout(() => {
        setShortlistError(null);
      }, 3000);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleRemoveFromShortlist = async () => {
    setShortlistError(null);
    setShortlistSuccess(null);
    try {
      setShortlistLoading(true);
      setIsShortlisted(false); // Optimistic update
      await dispatch(removeFromShortlist(property.id)).unwrap();
      setShortlistSuccess("Property removed from shortlist");
      setTimeout(() => {
        setShortlistSuccess(null);
      }, 3000);
    } catch (error: unknown) {
      console.error("Error removing from shortlist:", error);
      setIsShortlisted(true); // Revert optimistic update on error
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove from shortlist";
      setShortlistError(errorMessage);
      setTimeout(() => {
        setShortlistError(null);
      }, 3000);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/properties/${property.id}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 cursor-pointer group">
      {/* Image Section */}
      <div className="relative h-44 bg-slate-100" onClick={handleCardClick}>
        {/* Match Badge - Left Top */}
        <div className="absolute top-3 left-3 z-10 group">
          <div
            className={`w-20 bg-black/60 backdrop-blur-[3px] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg relative transition-all duration-200 ${
              !isAuthenticated ? "cursor-pointer hover:bg-black/100" : ""
            }`}
          >
            {isAuthenticated ? Math.round(matchScore) : 0}% Match
          </div>
          {/* Simple glass hint for unauthenticated users */}
          {!isAuthenticated && (
            <div className="mt-2 inline-block hidden group-hover:block">
              <div className="w-fit px-2.5 py-1.5 text-[11px] leading-snug font-medium text-slate-800 bg-white/70 border border-white/40 backdrop-blur-md rounded-xl shadow-md">
                Sign in to see why this matches you
              </div>
            </div>
          )}
        </div>

        {/* Shortlist Button - Right Top */}
        {showShortlist && user && user.role === "tenant" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShortlistToggle();
            }}
            disabled={shortlistLoading}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-10 ${
              isShortlisted
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-white/95 text-slate-600 hover:bg-white hover:text-rose-600"
            } ${shortlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-200 ${
                isShortlisted ? "fill-current" : ""
              }`}
            />
          </button>
        )}

        <img
          src={getMainImage()}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onLoad={onImageLoad}
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        />
      </div>

      {/* Content Section */}
      <div className="p-4" onClick={handleCardClick}>
        <h3 className="font-semibold text-slate-900 text-base mb-1 line-clamp-1">
          {property.title}
        </h3>

        <div className="flex items-start gap-1 mb-3">
          <MapPin className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0" />
          <span className="text-slate-500 text-xs line-clamp-1">
            {property.address}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <Bed className="w-3 h-3" />
            <span>
              {property.bedrooms} Bed{property.bedrooms !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3 h-3" />
            <span>
              {property.bathrooms} Bath{property.bathrooms !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>500 sq ft</span>
          </div>
        </div>

        {/* Property Type and Furnishing */}
        <div className="flex items-center gap-1 mb-3 text-xs">
          <span className="text-slate-500">Furnished</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">
            {Array.isArray(property.property_type)
              ? property.property_type[0]
              : property.property_type}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">Available</span>
        </div>

        {/* Price and Availability */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-slate-900">
              £{property.price?.toLocaleString() || "TBD"}
            </span>
            <span className="text-slate-500 text-xs ml-1">/ month</span>
            <span className="text-slate-400 text-xs ml-2">•</span>
            <span className="text-slate-500 text-xs ml-2">Available now</span>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {shortlistSuccess && (
        <div className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
          {shortlistSuccess}
        </div>
      )}
      {shortlistError && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
          {shortlistError}
        </div>
      )}
    </div>
  );
}
