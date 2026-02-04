import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // Check if property is in shortlist from Redux state
  useEffect(() => {
    const isInShortlist = shortlistProperties.some((p) => p.id === property.id);
    if (isInShortlist !== isShortlisted) {
      setIsShortlisted(isInShortlist);
    }
  }, [shortlistProperties, property.id, isShortlisted]);

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
      setShowRemoveModal(false);

      await dispatch(removeFromShortlist(property.id)).unwrap();

      setSuccess("Property removed from shortlist");
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
      setShowRemoveModal(true);
      return;
    }

    await handleAddToShortlist();
  };

  const handleCloseRemoveModal = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!loading) {
      setShowRemoveModal(false);
    }
  };

  return {
    isShortlisted,
    loading,
    error,
    success,
    showRemoveModal,
    handleShortlistToggle,
    handleRemoveFromShortlist,
    handleCloseRemoveModal,
  };
};

export default useShortlist;
