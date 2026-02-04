"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Heart } from "lucide-react";
import ConfirmModal from "@/shared/ui/Modal/ConfirmModal";
import { useShortlist } from "@/features/shortlist/lib/useShortlist";
import { selectUser } from "@/app/store/slices/authSlice";
import { Property } from "@/app/types";

interface ShortlistToggleButtonProps {
  property: Property;
  showShortlist?: boolean;
  onStatusChange?: (status: {
    success: string | null;
    error: string | null;
  }) => void;
}

export default function ShortlistToggleButton({
  property,
  showShortlist = true,
  onStatusChange,
}: ShortlistToggleButtonProps) {
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

  // Bubble success/error status to parent (for displaying in PropertyContent)
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({ success: shortlistSuccess, error: shortlistError });
    }
  }, [shortlistSuccess, shortlistError, onStatusChange]);

  return (
    <>
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
    </>
  );
}

export { ShortlistToggleButton };
