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
import { Heart, MapPin, Bed, Bath, Calendar } from "lucide-react";
import { PROPERTY_PLACEHOLDER } from "../utils/placeholders";
import ConfirmModal from "./ui/ConfirmModal";
import FeaturedBadge from "./ui/FeaturedBadge";

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  showShortlist?: boolean;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  hasTopRightBadge?: boolean; // Legacy prop for compatibility
  showFeaturedBadge?: boolean; // Show featured badge on bottom right
}

export default function PropertyCard({
  property,
  onClick,
  showShortlist = true,
  imageLoaded = true,
  onImageLoad,
  hasTopRightBadge = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  showFeaturedBadge = false,
}: PropertyCardProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const shortlistProperties = useSelector(selectShortlistProperties);

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);
  const [shortlistSuccess, setShortlistSuccess] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // Check if property is in shortlist from Redux state (only source of truth)
  useEffect(() => {
    // Only use Redux state - no API fallback to prevent cycling calls
    const isInShortlist = shortlistProperties.some((p) => p.id === property.id);

    // Only update local state if it differs from Redux state
    // This prevents unnecessary re-renders and state conflicts
    if (isInShortlist !== isShortlisted) {
      setIsShortlisted(isInShortlist);
    }
  }, [shortlistProperties, property.id, isShortlisted]);

  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!showShortlist || !property?.id || !user || user.role !== "tenant") {
      console.warn(
        "Shortlist operation not allowed for non-tenant user or missing data"
      );
      return;
    }

    // If removing from shortlist, show confirmation modal
    if (isShortlisted) {
      setShowRemoveModal(true);
      return;
    }

    // Add to shortlist directly (no confirmation needed)
    await handleAddToShortlist();
  };

  const handleAddToShortlist = async () => {
    // Clear any existing messages
    setShortlistError(null);
    setShortlistSuccess(null);

    try {
      setShortlistLoading(true);

      // Optimistically update UI immediately
      setIsShortlisted(true);

      await dispatch(
        addToShortlist({ propertyId: property.id, property })
      ).unwrap();
      setShortlistSuccess("Property added to shortlist");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setShortlistSuccess(null);
      }, 3000);
    } catch (error: unknown) {
      console.error("Error adding to shortlist:", error);

      // Revert optimistic update on error
      setIsShortlisted(false);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to add to shortlist";
      setShortlistError(errorMessage);

      // Clear error after 3 seconds
      setTimeout(() => {
        setShortlistError(null);
      }, 3000);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    // Clear any existing messages
    setShortlistError(null);
    setShortlistSuccess(null);

    try {
      setShortlistLoading(true);

      // Optimistically update UI immediately
      setIsShortlisted(false);
      setShowRemoveModal(false);

      await dispatch(removeFromShortlist(property.id)).unwrap();
      setShortlistSuccess("Property removed from shortlist");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setShortlistSuccess(null);
      }, 3000);
    } catch (error: unknown) {
      console.error("Error removing from shortlist:", error);

      // Revert optimistic update on error
      setIsShortlisted(true);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove from shortlist";
      setShortlistError(errorMessage);

      // Clear error after 3 seconds
      setTimeout(() => {
        setShortlistError(null);
      }, 3000);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleCloseRemoveModal = (e?: React.MouseEvent) => {
    // Prevent any event propagation when closing modal
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!shortlistLoading) {
      setShowRemoveModal(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-slate-100">
        {/* Featured Badge */}
        {showFeaturedBadge && <FeaturedBadge />}
        <img
          src={getMainImage()}
          alt={property.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
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

        {/* Loading overlay when image is not loaded */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slideIn_1.5s_infinite]"></div>
          </div>
        )}

        {/* Shortlist Button */}
        {showShortlist && user && user.role === "tenant" && (
          <button
            onClick={handleShortlistToggle}
            disabled={shortlistLoading}
            className={`absolute top-4 left-4 w-10 h-10 rounded-full shadow-md transition-all duration-200 flex items-center justify-center ${
              isShortlisted
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-white/90 text-slate-600 hover:bg-white hover:text-rose-600"
            } ${shortlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isShortlisted ? "fill-current" : ""
              }`}
            />
          </button>
        )}

        {/* BTR Badge */}
        {property.is_btr && (
          <div className="absolute top-3 left-3 bg-violet-600 text-white px-2 py-1 rounded-md text-xs font-medium">
            BTR
          </div>
        )}

        {/* Property Type Badge */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium capitalize">
          {property.property_type}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title and Price */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-1">
            {property.title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(property.price)}
              <span className="text-sm font-normal text-slate-500">/month</span>
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-slate-600 mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{property.address}</span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-3 text-sm text-slate-600">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span>
              {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span>
              {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              {property.available_from
                ? formatDate(property.available_from)
                : "Available now"}
            </span>
          </div>
        </div>

        {/* Features */}
        {property.lifestyle_features &&
          property.lifestyle_features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {property.lifestyle_features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs"
                >
                  {feature}
                </span>
              ))}
              {property.lifestyle_features.length > 3 && (
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">
                  +{property.lifestyle_features.length - 3} more
                </span>
              )}
            </div>
          )}

        {/* Furnishing */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 capitalize">
            {property.furnishing}
          </span>

          {/* Operator Info */}
          {property.operator && (
            <span className="text-xs text-slate-500">
              By {property.operator.full_name || property.operator.email}
            </span>
          )}
        </div>

        {/* Status Messages */}
        {(shortlistSuccess || shortlistError) && (
          <div
            className={`mt-3 p-2 rounded-md text-sm ${
              shortlistSuccess
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {shortlistSuccess || shortlistError}
          </div>
        )}
      </div>

      {/* Remove from Shortlist Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={handleCloseRemoveModal}
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
