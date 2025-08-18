"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Property } from "../types";
import { selectUser } from "../store/slices/authSlice";
import {
  addToShortlist,
  removeFromShortlist,
  selectShortlistProperties,
} from "../store/slices/shortlistSlice";
import { AppDispatch } from "../store/store";
import { Heart, BedDouble, Bath, Move, Check, X } from "lucide-react";
import { PROPERTY_PLACEHOLDER } from "../utils/placeholders";
import ConfirmModal from "./ui/ConfirmModal";

interface EnhancedPropertyCardProps {
  property: Property;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  matchScore?: number;
  userPreferences?: any;
}

export default function EnhancedPropertyCard({
  property,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
  matchScore,
  userPreferences,
}: EnhancedPropertyCardProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const shortlistProperties = useSelector(selectShortlistProperties);

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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
      const featuredImage = property.media.find((media) => media.is_featured);
      return featuredImage ? featuredImage.url : property.media[0].url;
    }
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    return PROPERTY_PLACEHOLDER;
  };

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

  const getMatchReasons = () => {
    const reasons = [];

    // Price matching
    if (userPreferences?.min_price && userPreferences?.max_price) {
      const propertyPrice =
        typeof property.price === "string"
          ? parseFloat(property.price)
          : property.price;
      const isWithinBudget =
        propertyPrice >= userPreferences.min_price &&
        propertyPrice <= userPreferences.max_price;
      reasons.push({
        matches: isWithinBudget,
        details: `Price ${propertyPrice.toFixed(0)} within budget ${
          userPreferences.min_price
        }-${userPreferences.max_price}`,
      });
    }

    // Bedroom requirement
    if (userPreferences?.min_bedrooms) {
      const meetsBedroomReq = property.bedrooms >= userPreferences.min_bedrooms;
      reasons.push({
        matches: meetsBedroomReq,
        details: `${property.bedrooms} bedrooms meets requirements (${userPreferences.min_bedrooms}+needed)`,
      });
    }

    // Property type matching
    if (
      userPreferences?.property_type &&
      userPreferences.property_type.length > 0
    ) {
      const matchesType = userPreferences.property_type.includes(
        property.property_type
      );
      reasons.push({
        matches: matchesType,
        details: `${property.property_type} ${
          matchesType ? "matches" : "doesn't match"
        } preferences`,
      });
    }

    return reasons;
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
    >
      {/* Image Section */}
      <div className="relative h-64 bg-gray-100 overflow-hidden rounded-t-2xl">
        <img
          src={getMainImage()}
          alt={property.title}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            if (onImageLoad) {
              onImageLoad();
            }
          }}
          onError={(e) => {
            e.currentTarget.src = PROPERTY_PLACEHOLDER;
            if (onImageLoad) {
              onImageLoad();
            }
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Match Score Badge with Tooltip */}
        {matchScore !== undefined && matchScore !== null && (
          <div
            className="absolute top-4 left-4 z-20"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="flex items-center backdrop-blur-[3px] gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg cursor-pointer bg-black/60 text-white">
              <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              {Math.round(matchScore)}% Match
            </div>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute top-full left-0 mt-7 w-80 bg-black/60 backdrop-blur-[3px] text-white rounded-lg p-4 shadow-xl z-40">
                {/* Arrow */}
                <div className="absolute -top-2 left-6">
                  <div className="w-4 h-4 bg-gray-800 rotate-45"></div>
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
          </div>
        )}

        {/* Shortlist Button */}
        {showShortlist && user && user.role === "tenant" && (
          <button
            onClick={handleShortlistToggle}
            disabled={shortlistLoading}
            className={`absolute bg-black/60 backdrop-blur-[3px] top-4 right-4 w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-10 ${
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
