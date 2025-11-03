import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { propertiesAPI } from "../lib/api";
import { Property } from "../types";
import { withErrorHandling } from "../lib/apiResponseHandler";

interface PropertyDetailState {
  property: Property | null;
  loading: boolean;
  error: string | null;
  authModalOpen: boolean;
}

interface UsePropertyDetailReturn {
  state: PropertyDetailState;
  allImages: string[];
  publishDate: Date;
  setAuthModalOpen: (open: boolean) => void;
  retryLoad: () => void;
}

export const usePropertyDetail = (): UsePropertyDetailReturn => {
  const { id } = useParams();

  const [state, setState] = useState<PropertyDetailState>({
    property: null,
    loading: true,
    error: null,
    authModalOpen: false,
  });

  const loadProperty = async () => {
    if (!id) {
      setState((prev) => ({
        ...prev,
        error: "Property ID is missing",
        loading: false,
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await withErrorHandling(() =>
        propertiesAPI.getByIdPublic(id as string)
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          property: response.data,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: response.message || "Failed to load property details",
          loading: false,
        }));
      }
    } catch (error: any) {
      console.error("Error fetching property:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to load property details",
        loading: false,
      }));
    }
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  const allImages = useMemo(() => {
    if (!state.property) return [];

    const mediaUrls = (state.property.media || [])
      .map((m: any) => m.url || m.s3_url)
      .filter(Boolean);
    const legacy = state.property.images || [];
    return [...mediaUrls, ...legacy];
  }, [state.property]);

  const publishDate = useMemo(() => {
    if (!state.property) return new Date();

    return new Date(
      (state.property as any).created_at ||
        (state.property as any).createdAt ||
        Date.now()
    );
  }, [state.property]);

  const setAuthModalOpen = (open: boolean) => {
    setState((prev) => ({ ...prev, authModalOpen: open }));
  };

  const retryLoad = () => {
    loadProperty();
  };

  return {
    state,
    allImages,
    publishDate,
    setAuthModalOpen,
    retryLoad,
  };
};
