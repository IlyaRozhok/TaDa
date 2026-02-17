import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { AppDispatch } from "@/app/store/store";
import {
  addToShortlist,
  removeFromShortlist,
  selectShortlistProperties,
} from "@/features/shortlist/model/shortlistSlice";
import { Property } from "@/app/types";

export const useShortlist = (property: Property, showShortlist: boolean) => {
  const dispatch = useDispatch<AppDispatch>();
  const shortlistProperties = useSelector(selectShortlistProperties);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync local state with Redux shortlist (do not depend on isShortlisted to avoid update loop)
  useEffect(() => {
    const isInShortlist = shortlistProperties.some((p) => p.id === property.id);
    setIsShortlisted(isInShortlist);
  }, [shortlistProperties, property.id]);

  const handleAddToShortlist = async () => {
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      setIsShortlisted(true);

      await dispatch(
        addToShortlist({ propertyId: property.id, property })
      ).unwrap();

      setSuccess("Property added to shortlist");
      toast.success("Property added to favourites", {
        duration: 4000,
        icon: null,
        className: "toast-glass",
        style: {
          background: "rgba(15, 23, 42, 0.75)",
          color: "#fff",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          fontSize: "14px",
          fontWeight: "500",
          maxWidth: "400px",
        },
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: unknown) {
      console.error("Error adding to shortlist:", error);
      setIsShortlisted(false);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to add to shortlist";
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromShortlist = async () => {
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      setIsShortlisted(false);

      await dispatch(removeFromShortlist(property.id)).unwrap();

      setSuccess("Property removed from shortlist");
      toast.success("Removed from favourites", {
        duration: 4000,
        icon: null,
        className: "toast-glass",
        style: {
          background: "rgba(15, 23, 42, 0.75)",
          color: "#fff",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          fontSize: "14px",
          fontWeight: "500",
          maxWidth: "400px",
        },
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: unknown) {
      console.error("Error removing from shortlist:", error);
      setIsShortlisted(true);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove from shortlist";
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!showShortlist || !property?.id) {
      console.warn("Shortlist operation not allowed");
      return;
    }

    if (isShortlisted) {
      await handleRemoveFromShortlist();
      return;
    }

    await handleAddToShortlist();
  };

  return {
    isShortlisted,
    loading,
    error,
    success,
    handleShortlistToggle,
    handleRemoveFromShortlist,
  };
};

export default useShortlist;
