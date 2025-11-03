"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Property } from "../types";
import { selectUser } from "../store/slices/authSlice";
import { Heart } from "lucide-react";
import ConfirmModal from "./ui/ConfirmModal";
import { PropertyImage } from "./PropertyImage";
import { PropertyContent } from "./PropertyContent";
import { PropertyBadges } from "./PropertyBadges";
import { useShortlist } from "../hooks/useShortlist";

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
  const user = useSelector(selectUser);

  const {
    isShortlisted,
    loading: shortlistLoading,
    error: shortlistError,
    success: shortlistSuccess,
    showRemoveModal,
    handleShortlistToggle,
    handleRemoveFromShortlist,
    handleCloseRemoveModal,
  } = useShortlist(property, showShortlist);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/app/properties/${property.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative">
        <PropertyImage
          property={property}
          imageLoaded={imageLoaded}
          onImageLoad={onImageLoad}
          showFeaturedBadge={showFeaturedBadge}
        />

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

        <PropertyBadges property={property} />
      </div>

      {/* Content Section */}
      <PropertyContent
        property={property}
        shortlistSuccess={shortlistSuccess}
        shortlistError={shortlistError}
      />

      {/* Remove from Shortlist Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={handleCloseRemoveModal}
        onConfirm={handleRemoveFromShortlist}
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
