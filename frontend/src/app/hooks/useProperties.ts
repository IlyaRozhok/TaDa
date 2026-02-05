"use client";

import { useState, useCallback, useEffect } from "react";
import {
  propertiesAPI,
  Property,
  PropertyFilters,
  MatchingResult,
  DetailedMatchingResult,
  matchingAPI,
  SortOptions,
  PaginationOptions,
  PropertyQueryOptions,
} from "../lib/api";
import { useDebounce, useDebouncedApiCall } from "./useDebounce";

// Pure helper functions for filtering, sorting, and pagination
export const propertyFilters = {
  // Price range filter
  byPriceRange: (
    properties: Property[],
    minPrice?: number,
    maxPrice?: number
  ): Property[] => {
    if (!minPrice && !maxPrice) return properties;

    return properties.filter((property) => {
      const price = Number(property.price) || 0;
      const meetsMin = !minPrice || price >= minPrice;
      const meetsMax = !maxPrice || price <= maxPrice;
      return meetsMin && meetsMax;
    });
  },

  // Bedrooms filter (minimum bedrooms required)
  byBedrooms: (properties: Property[], bedrooms?: number): Property[] => {
    if (!bedrooms || bedrooms <= 0) return properties;
    return properties.filter(
      (property) => Number(property.bedrooms) >= bedrooms!
    );
  },

  // Bathrooms filter (minimum bathrooms required)
  byBathrooms: (properties: Property[], bathrooms?: number): Property[] => {
    if (!bathrooms || bathrooms <= 0) return properties;
    return properties.filter(
      (property) => Number(property.bathrooms) >= bathrooms!
    );
  },

  // Property type filter
  byPropertyType: (
    properties: Property[],
    propertyType?: string
  ): Property[] => {
    if (!propertyType || propertyType === "all") return properties;
    return properties.filter(
      (property) =>
        property.property_type?.toLowerCase() === propertyType.toLowerCase()
    );
  },

  // Furnishing filter
  byFurnishing: (properties: Property[], furnishing?: string): Property[] => {
    if (!furnishing || furnishing === "all") return properties;
    return properties.filter(
      (property) =>
        property.furnishing?.toLowerCase() === furnishing.toLowerCase()
    );
  },

  // Tenant types filter (must match at least one)
  byTenantTypes: (
    properties: Property[],
    tenantTypes?: string[]
  ): Property[] => {
    if (!tenantTypes || tenantTypes.length === 0) return properties;
    return properties.filter((property) => {
      const propertyTenantTypes = (property as any).tenant_types as string[] | undefined;
      if (!propertyTenantTypes || propertyTenantTypes.length === 0)
        return false;
      return tenantTypes.some((tenantType) =>
        propertyTenantTypes.includes(tenantType)
      );
    });
  },

  // Amenities filter (must have all specified amenities)
  byAmenities: (properties: Property[], amenities?: string[]): Property[] => {
    if (!amenities || amenities.length === 0) return properties;
    return properties.filter((property) => {
      const propertyAmenities = (property as any).amenities as string[] | undefined;
      if (!propertyAmenities || propertyAmenities.length === 0) return false;
      return amenities.every((amenity) =>
        propertyAmenities.some((propAmenity) =>
          propAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      );
    });
  },

  // Square meters range filter
  bySquareMeters: (
    properties: Property[],
    minSqm?: number,
    maxSqm?: number
  ): Property[] => {
    if (!minSqm && !maxSqm) return properties;

    return properties.filter((property) => {
      const sqm =
        Number(property.square_meters) || Number(property.total_area) || 0;
      if (sqm === 0) return false; // Skip properties without size info

      const meetsMin = !minSqm || sqm >= minSqm;
      const meetsMax = !maxSqm || sqm <= maxSqm;
      return meetsMin && meetsMax;
    });
  },

  // Search filter (title, address, property type)
  bySearch: (properties: Property[], searchTerm?: string): Property[] => {
    if (!searchTerm || searchTerm.trim() === "") return properties;

    const searchLower = searchTerm.toLowerCase().trim();
    return properties.filter((property) => {
      const title = property.title?.toLowerCase() || "";
      const address = property.address?.toLowerCase() || "";
      const propertyType = property.property_type?.toLowerCase() || "";

      return (
        title.includes(searchLower) ||
        address.includes(searchLower) ||
        propertyType.includes(searchLower)
      );
    });
  },
};

// Sorting functions
export const propertySorters = {
  byPrice: (
    properties: Property[],
    direction: "asc" | "desc" = "asc"
  ): Property[] => {
    return [...properties].sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      return direction === "asc" ? priceA - priceB : priceB - priceA;
    });
  },

  byDate: (
    properties: Property[],
    direction: "asc" | "desc" = "desc"
  ): Property[] => {
    return [...properties].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return direction === "desc" ? dateB - dateA : dateA - dateB;
    });
  },

  byBedrooms: (
    properties: Property[],
    direction: "asc" | "desc" = "asc"
  ): Property[] => {
    return [...properties].sort((a, b) => {
      const bedsA = Number(a.bedrooms) || 0;
      const bedsB = Number(b.bedrooms) || 0;
      return direction === "asc" ? bedsA - bedsB : bedsB - bedsA;
    });
  },

  bySquareMeters: (
    properties: Property[],
    direction: "asc" | "desc" = "asc"
  ): Property[] => {
    return [...properties].sort((a, b) => {
      const sqmA = Number(a.square_meters) || Number(a.total_area) || 0;
      const sqmB = Number(b.square_meters) || Number(b.total_area) || 0;
      return direction === "asc" ? sqmA - sqmB : sqmB - sqmA;
    });
  },

  byRelevance: (
    properties: Property[],
    direction: "asc" | "desc" = "desc"
  ): Property[] => {
    // For now, sort by creation date (newest first) as relevance proxy
    // In future, this could use a relevance score algorithm
    return propertySorters.byDate(properties, direction);
  },
};

// Pagination function
export const paginateProperties = (
  properties: Property[],
  page: number = 1,
  limit: number = 12
): { items: Property[]; total: number; page: number; totalPages: number } => {
  const total = properties.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = properties.slice(startIndex, endIndex);

  return { items, total, page, totalPages };
};

// Main filtering pipeline function
export const filterAndSortProperties = (
  properties: Property[],
  filters: PropertyFilters = {},
  sortOptions: SortOptions = { sortBy: "date", sortDirection: "desc" }
): Property[] => {
  if (!Array.isArray(properties)) return [];

  let filtered = [...properties];

  // Apply filters in logical order
  filtered = propertyFilters.bySearch(filtered, filters.search);
  filtered = propertyFilters.byPriceRange(
    filtered,
    filters.min_price,
    filters.max_price
  );
  filtered = propertyFilters.byBedrooms(filtered, filters.bedrooms);
  filtered = propertyFilters.byBathrooms(filtered, filters.bathrooms);
  filtered = propertyFilters.byPropertyType(filtered, filters.property_type);
  filtered = propertyFilters.byFurnishing(filtered, filters.furnishing);
  filtered = propertyFilters.byTenantTypes(filtered, filters.tenant_types);
  filtered = propertyFilters.byAmenities(filtered, filters.amenities);
  filtered = propertyFilters.bySquareMeters(
    filtered,
    filters.min_square_meters,
    filters.max_square_meters
  );

  // Apply sorting
  switch (sortOptions.sortBy) {
    case "price":
      filtered = propertySorters.byPrice(filtered, sortOptions.sortDirection);
      break;
    case "date":
      filtered = propertySorters.byDate(filtered, sortOptions.sortDirection);
      break;
    case "bedrooms":
      filtered = propertySorters.byBedrooms(
        filtered,
        sortOptions.sortDirection
      );
      break;
    case "square_meters":
      filtered = propertySorters.bySquareMeters(
        filtered,
        sortOptions.sortDirection
      );
      break;
    case "relevance":
      filtered = propertySorters.byRelevance(
        filtered,
        sortOptions.sortDirection
      );
      break;
    default:
      filtered = propertySorters.byDate(filtered, "desc");
  }

  return filtered;
};

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;

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
      async (search: string, page: number = 1, limit: number = 12) => {
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

  const fetchPublicProperties = useCallback(
    async (page = 1, limit = 12, search?: string) => {
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
    async (id: string, isPublic = false): Promise<Property> => {
      try {
        setLoading(true);
        setError(null);

        const response = isPublic
          ? await propertiesAPI.getByIdPublic(id)
          : await propertiesAPI.getById(id);

        return response.data;
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
    async (search: string, page = 1, limit = 12) => {
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
      console.log("✅ Matched properties response:", {
        hasResponse: !!response,
        hasData: !!response?.data,
        dataType: typeof response?.data,
      });

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
  searchTerm?: string,
  sortOptions?: SortOptions,
  paginationOptions?: PaginationOptions
) => {
  const { properties, loading, error, fetchProperties } = useProperties();
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [paginatedProperties, setPaginatedProperties] = useState<Property[]>(
    []
  );
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
  });

  const applyFilters = useCallback(() => {
    if (!Array.isArray(properties)) {
      setFilteredProperties([]);
      setPaginatedProperties([]);
      setPaginationInfo({ total: 0, page: 1, totalPages: 0 });
      return;
    }

    // Combine filters with search term
    const combinedFilters: PropertyFilters = {
      ...filters,
      search: searchTerm || filters?.search,
    };

    // Default sort options
    const defaultSortOptions: SortOptions = {
      sortBy: "date",
      sortDirection: "desc",
      ...sortOptions,
    };

    // Apply filtering and sorting
    const filtered = filterAndSortProperties(
      properties,
      combinedFilters,
      defaultSortOptions
    );

    setFilteredProperties(filtered);

    // Apply pagination if specified
    if (paginationOptions) {
      const paginated = paginateProperties(
        filtered,
        paginationOptions.page,
        paginationOptions.limit
      );
      setPaginatedProperties(paginated.items);
      setPaginationInfo({
        total: paginated.total,
        page: paginated.page,
        totalPages: paginated.totalPages,
      });
    } else {
      // No pagination - return all filtered properties
      setPaginatedProperties(filtered);
      setPaginationInfo({
        total: filtered.length,
        page: 1,
        totalPages: 1,
      });
    }
  }, [properties, filters, searchTerm, sortOptions, paginationOptions]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    properties,
    filteredProperties,
    paginatedProperties,
    paginationInfo,
    loading,
    error,
    fetchProperties,
    applyFilters,
  };
};
