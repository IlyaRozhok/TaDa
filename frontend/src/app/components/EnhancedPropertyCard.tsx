// DEPRECATED: Use PropertyCard from @/entities/property/ui instead
// This is a compatibility wrapper that will be removed in a future version

"use client";

import React from "react";
import PropertyCard from "@/entities/property/ui/PropertyCard";
import { Property } from "../types";
import { CategoryMatchResult } from "../lib/api";

interface EnhancedPropertyCardProps {
  property: Property;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  matchScore?: number;
  userPreferences?: any;
  matchCategories?: CategoryMatchResult[];
}

export default function EnhancedPropertyCard({
  property,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
  matchScore,
  userPreferences,
  matchCategories,
}: EnhancedPropertyCardProps) {
  return (
    <PropertyCard
      property={property}
      onClick={onClick}
      showShortlist={showShortlist}
      imageLoaded={imageLoaded}
      onImageLoad={onImageLoad}
      matchScore={matchScore}
      userPreferences={userPreferences}
      matchCategories={matchCategories}
      variant="enhanced"
    />
  );
}
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const shortlistProperties = useSelector(selectShortlistProperties);

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageSuccessfullyLoaded, setImageSuccessfullyLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);

  // Check if property is in shortlist
  useEffect(() => {
    const isInShortlist = shortlistProperties.some((p) => p.id === property.id);
    setIsShortlisted(isInShortlist);
  }, [shortlistProperties, property.id]);

  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!showShortlist || !property?.id || !user || user.role !== "tenant") {
      return;
    }

    if (isShortlisted) {
      setShowRemoveModal(true);
      return;
    }

    await handleAddToShortlist();
  };

  const handleAddToShortlist = async () => {
    try {
      setShortlistLoading(true);
      setIsShortlisted(true);

      await dispatch(
        addToShortlist({ propertyId: property.id, property })
      ).unwrap();
    } catch (error) {
      setIsShortlisted(false);
      console.error("Error adding to shortlist:", error);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    try {
      setShortlistLoading(true);
      setIsShortlisted(false);
      setShowRemoveModal(false);

      await dispatch(removeFromShortlist(property.id)).unwrap();
    } catch (error) {
      setIsShortlisted(true);
      console.error("Error removing from shortlist:", error);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/app/properties/${property.id}`);
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "£0";

    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

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

  // Reset image state when property changes
  useEffect(() => {
    setImageSuccessfullyLoaded(false);
    setCurrentImageSrc(null);
  }, [property.id]);

  const getScoreColor = (score: number) => {
    return "bg-gray-800 text-white";
  };

  const formatSquareFeet = (area: number) => {
    return `${area.toLocaleString()} sq ft`;
  };

  const getPropertyTags = () => {
    const tags = [];

    if (property.is_btr) {
      tags.push("Built to rent");
    }

    if (property.property_type) {
      tags.push(property.property_type);
    }

    if (property.furnishing) {
      tags.push(property.furnishing);
    }

    return tags;
  };

  const getMatchReasons = (): {
    matches: boolean;
    details: string;
    category?: string;
  }[] => {
    // If we have categories from backend, use them
    if (matchCategories && matchCategories.length > 0) {
      return matchCategories
        .filter((cat) => cat.maxScore > 0) // Only show categories that were evaluated
        .sort((a, b) => b.maxScore - a.maxScore) // Sort by importance
        .slice(0, 6) // Show top 6 categories
        .map((cat) => ({
          matches: cat.match,
          details: cat.details || cat.reason,
          category: cat.category,
        }));
    }

    // Fallback: calculate locally if no backend data
    const reasons: { matches: boolean; details: string; category?: string }[] =
      [];

    // Price matching
    if (userPreferences?.min_price && userPreferences?.max_price) {
      const propertyPrice =
        typeof property.price === "string"
          ? parseFloat(property.price)
          : property.price;

      if (
        propertyPrice !== null &&
        propertyPrice !== undefined &&
        !isNaN(propertyPrice)
      ) {
        const isWithinBudget =
          propertyPrice >= userPreferences.min_price &&
          propertyPrice <= userPreferences.max_price;
        reasons.push({
          matches: isWithinBudget,
          details: `Price £${propertyPrice.toFixed(0)} ${
            isWithinBudget ? "within" : "outside"
          } budget £${userPreferences.min_price}-£${userPreferences.max_price}`,
          category: "budget",
        });
      }
    }

    // Bedroom requirement
    if (userPreferences?.bedrooms && userPreferences.bedrooms.length > 0) {
      const meetsBedroomReq = userPreferences.bedrooms.includes(
        property.bedrooms
      );
      reasons.push({
        matches: meetsBedroomReq,
        details: `${property.bedrooms} bedroom${
          property.bedrooms !== 1 ? "s" : ""
        } ${meetsBedroomReq ? "matches" : "doesn't match"} preference`,
        category: "bedrooms",
      });
    } else if (userPreferences?.min_bedrooms) {
      const meetsBedroomReq = property.bedrooms >= userPreferences.min_bedrooms;
      reasons.push({
        matches: meetsBedroomReq,
        details: `${property.bedrooms} bedrooms ${
          meetsBedroomReq ? "meets" : "below"
        } requirement (${userPreferences.min_bedrooms}+)`,
        category: "bedrooms",
      });
    }

    // Property type matching
    if (
      userPreferences?.property_types &&
      userPreferences.property_types.length > 0
    ) {
      const matchesType = userPreferences.property_types.includes(
        property.property_type
      );
      reasons.push({
        matches: matchesType,
        details: `${property.property_type || "Unknown"} ${
          matchesType ? "matches" : "doesn't match"
        } preferences`,
        category: "propertyType",
      });
    }

    // Pet policy
    if (userPreferences?.pet_policy === true) {
      const allowsPets = property.pet_policy === true;
      reasons.push({
        matches: allowsPets,
        details: allowsPets ? "Pet-friendly property" : "Pets not allowed",
        category: "pets",
      });
    }

    // Bills
    if (userPreferences?.bills) {
      const billsMatch = property.bills === userPreferences.bills;
      reasons.push({
        matches: billsMatch,
        details: `Bills ${property.bills || "excluded"}`,
        category: "bills",
      });
    }

    return reasons;
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Image Section */}
      <div className="relative h-64 bg-gray-100 overflow-hidden rounded-t-xl">
        <img
          src={
            imageSuccessfullyLoaded && currentImageSrc
              ? currentImageSrc
              : getMainImage()
          }
          alt={property.title}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded || imageSuccessfullyLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={(e) => {
            const target = e.currentTarget;
            const currentSrc = target.src;

            // Only mark as successfully loaded if it's not a placeholder
            if (
              currentSrc !== PROPERTY_PLACEHOLDER &&
              !currentSrc.includes("data:image/svg+xml") &&
              !currentSrc.includes("Property Image")
            ) {
              setImageSuccessfullyLoaded(true);
              setCurrentImageSrc(currentSrc);
              if (onImageLoad) {
                onImageLoad();
              }
            }
          }}
          onError={(e) => {
            const target = e.currentTarget;
            const currentSrc = target.src;

            // Never replace image if it was successfully loaded before
            if (imageSuccessfullyLoaded && currentImageSrc) {
              // If we have a successfully loaded image, restore it
              target.src = currentImageSrc;
              return;
            }

            // Only show placeholder if image hasn't been successfully loaded before
            // and current source is not already placeholder
            if (
              !imageSuccessfullyLoaded &&
              currentSrc !== PROPERTY_PLACEHOLDER &&
              !currentSrc.includes("data:image/svg+xml") &&
              !currentSrc.includes("Property Image")
            ) {
              // Set placeholder only once
              target.src = PROPERTY_PLACEHOLDER;
            }
            // Still call onImageLoad to hide skeleton even on error
            if (onImageLoad) {
              onImageLoad();
            }
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Match Score Badge */}
        {matchScore !== undefined && matchScore !== null && (
          <div
            className="absolute top-4 left-4 z-30"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center backdrop-blur-[3px] gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg cursor-pointer bg-black/60 text-white">
              <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              {Math.round(matchScore)}% Match
            </div>
          </div>
        )}

        {/* Shortlist Button */}
        {showShortlist && user && user.role === "tenant" && (
          <button
            onClick={handleShortlistToggle}
            disabled={shortlistLoading}
            className={`absolute bg-black/60 backdrop-blur-[3px] cursor-pointer top-4 right-4 w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-10 ${
              shortlistLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Heart
              className={`w-7 h-7 transition-all duration-200 ${
                isShortlisted ? "fill-current" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Tooltip - positioned outside overflow-hidden container */}
      {matchScore !== undefined && matchScore !== null && showTooltip && (
        <div className="absolute top-[72px] left-4 w-80 bg-black/60 backdrop-blur-[3px] text-white rounded-lg p-4 shadow-xl z-[9999] pointer-events-none">
          {/* Arrow */}
          <div className="absolute -top-2 left-6">
            <div className="w-4 h-4 bg-black/60 rotate-45"></div>
          </div>

          <h3 className="text-base font-semibold text-white mb-3">
            Why this matches?
          </h3>

          <div className="space-y-2">
            {getMatchReasons().map((reason, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {reason.matches ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs leading-relaxed">
                    {reason.details}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {getMatchReasons().length === 0 && (
            <p className="text-gray-300 text-sm">
              No specific matching criteria available
            </p>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-gray-700 transition-colors">
          {property.title}
        </h3>

        {/* Address */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
          {property.address}
        </p>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center text-gray-900">
            <div className="w-5 h-5 mr-2 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
                <line x1="9" y1="6" x2="9" y2="18" />
              </svg>
            </div>
            <span className="font-medium text-base">
              {property.bedrooms} Bed{property.bedrooms !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center text-gray-900">
            <div className="w-5 h-5 mr-2 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                <path d="M8 8v13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8" />
                <path d="M6 8h12" />
              </svg>
            </div>
            <span className="font-medium text-base">
              {property.bathrooms} Bath{property.bathrooms !== 1 ? "s" : ""}
            </span>
          </div>

          {property.total_area && (
            <div className="flex items-center text-gray-900">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </div>
              <span className="font-medium text-base">
                {formatSquareFeet(property.total_area)}
              </span>
            </div>
          )}
        </div>

        {/* Property Tags */}
        <div className="mb-3">
          <span className="text-sm text-gray-600">
            {getPropertyTags().join(" • ")}
          </span>
        </div>

        {/* Price and Time */}
        <div className="flex items-end justify-between">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(property.price)}
            </span>
            <span className="text-gray-600 text-base ml-1">/ month</span>
            <span className="text-gray-500 text-sm ml-4">
              • Today{" "}
              {new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Remove from Shortlist Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleConfirmRemove}
        title="Remove from Shortlist"
        message={`Are you sure you want to remove "${
          property.title || "this property"
        }" from your shortlist?`}
        confirmText="Remove"
        cancelText="Keep"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        icon="heart"
        loading={shortlistLoading}
      />
    </div>
  );
}
