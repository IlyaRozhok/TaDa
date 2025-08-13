"use client";

import { useState, useCallback, useEffect } from "react";
import {
  propertiesAPI,
  Property,
  PropertyFilters,
  MatchingResult,
  DetailedMatchingResult,
  matchingAPI,
} from "../lib/api";
import { useDebounce, useDebouncedApiCall } from "./useDebounce";

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  fetchFeaturedProperties: (limit?: number) => Promise<void>;
  fetchPublicProperties: (
    page?: number,
    limit?: number,
    search?: string
  ) => Promise<Property[]>;
  fetchPropertyById: (id: string, isPublic?: boolean) => Promise<Property>;
  // Debounced methods
  debouncedSearchProperties: (
    search: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  searchLoading: boolean;
}

interface UseMatchedPropertiesReturn {
  matchedProperties: DetailedMatchingResult[];
  loading: boolean;
  error: string | null;
  fetchMatchedProperties: (limit?: number) => Promise<void>;
}

// Hook for general property operations
export const useProperties = (): UsePropertiesReturn => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search for properties
  const { debouncedCall: debouncedSearchCall, loading: searchLoading } =
    useDebouncedApiCall(
      async (search: string, page: number = 1, limit: number = 6) => {
        const response = await propertiesAPI.getPublic(page, limit, search);
        return response.data || [];
      },
      400 // 400ms delay to prevent cyclic requests
    );

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await propertiesAPI.getAll();
      const responseData = response.data || response;
      const propertiesData =
        responseData.data || responseData.properties || responseData || [];

      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
    } catch (err: unknown) {
      console.error("Error fetching properties:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load properties"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeaturedProperties = useCallback(async (limit = 6) => {
    try {
      setLoading(true);
      setError(null);

      const response = await propertiesAPI.getFeatured(limit);
      const propertiesData = response.data || response;

      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
    } catch (err: unknown) {
      console.error("Error fetching featured properties:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load featured properties"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPublicProperties = useCallback(
    async (page = 1, limit = 6, search?: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await propertiesAPI.getPublic(page, limit, search);
        const propertiesData = response.data || [];

        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
        return Array.isArray(propertiesData) ? propertiesData : [];
      } catch (err: unknown) {
        console.error("Error fetching public properties:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load properties"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchPropertyById = useCallback(
    async (id: string, isPublic = false) => {
      try {
        setLoading(true);
        setError(null);

        const property = isPublic
          ? await propertiesAPI.getByIdPublic(id)
          : await propertiesAPI.getById(id);

        return property;
      } catch (err: unknown) {
        console.error("Error fetching property:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load property";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debouncedSearchProperties = useCallback(
    async (search: string, page = 1, limit = 6) => {
      try {
        setError(null);
        const result = await debouncedSearchCall(search, page, limit);
        if (result) {
          setProperties(Array.isArray(result) ? result : []);
        }
      } catch (err: unknown) {
        console.error("Error in debounced search:", err);
        setError(
          err instanceof Error ? err.message : "Failed to search properties"
        );
      }
    },
    [debouncedSearchCall]
  );

  return {
    properties,
    loading,
    error,
    fetchProperties,
    fetchFeaturedProperties,
    fetchPublicProperties,
    fetchPropertyById,
    debouncedSearchProperties,
    searchLoading,
  };
};

// Hook for matched properties
export const useMatchedProperties = (): UseMatchedPropertiesReturn => {
  const [matchedProperties, setMatchedProperties] = useState<
    DetailedMatchingResult[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchedProperties = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching matched properties with limit:", limit);

      const response = await matchingAPI.getDetailedMatches(limit);
      console.log("✅ Matched properties response:", response);

      // Handle response data structure
      const matchedData = response?.data || response;
      const finalData = Array.isArray(matchedData) ? matchedData : [];

      console.log(
        "📊 Final matched properties:",
        finalData.length,
        "properties"
      );
      setMatchedProperties(finalData);
    } catch (err: unknown) {
      console.error("❌ Error fetching matched properties:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load matches";
      console.error("❌ Error details:", errorMessage);
      setError(errorMessage);
      setMatchedProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    matchedProperties,
    loading,
    error,
    fetchMatchedProperties,
  };
};

// Hook for filtered properties with local state management
export const useFilteredProperties = (
  filters?: PropertyFilters,
  searchTerm?: string
) => {
  const { properties, loading, error, fetchProperties } = useProperties();
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  const applyFilters = useCallback(() => {
    if (!Array.isArray(properties)) {
      setFilteredProperties([]);
      return;
    }

    let filtered = [...properties];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchLower) ||
          (property.address &&
            property.address.toLowerCase().includes(searchLower)) ||
          (property.property_type &&
            property.property_type.toLowerCase().includes(searchLower))
      );
    }

    // Apply filters
    if (filters?.min_price !== undefined && filters.min_price > 0) {
      filtered = filtered.filter(
        (property) => property.price >= filters.min_price!
      );
    }

    if (filters?.max_price !== undefined && filters.max_price > 0) {
      filtered = filtered.filter(
        (property) => property.price <= filters.max_price!
      );
    }

    if (filters?.bedrooms !== undefined && filters.bedrooms > 0) {
      filtered = filtered.filter(
        (property) => property.bedrooms === filters.bedrooms
      );
    }

    if (filters?.property_type && filters.property_type !== "all") {
      filtered = filtered.filter(
        (property) => property.property_type === filters.property_type
      );
    }

    setFilteredProperties(filtered);
  }, [properties, filters, searchTerm]);

  // Apply filters whenever properties, filters, or search term changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    properties,
    filteredProperties,
    loading,
    error,
    fetchProperties,
    applyFilters,
  };
};
