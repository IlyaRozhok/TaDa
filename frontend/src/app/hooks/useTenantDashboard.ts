import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Property } from "../types";
import {
  propertiesAPI,
  preferencesAPI,
  matchingAPI,
  PropertyMatchResult,
  CategoryMatchResult,
} from "../lib/api";
import { selectUser } from "../store/slices/authSlice";
import { useDebounce } from "./useDebounce";
import { waitForSessionManager } from "../components/providers/SessionManager";

interface MatchedProperty {
  property: Property;
  matchScore: number;
  categories?: CategoryMatchResult[];
}

interface DashboardState {
  searchTerm: string;
  properties: Property[];
  matchedProperties: MatchedProperty[];
  userPreferences: any;
  loading: boolean;
  error: string | null;
  totalCount: number;
  preferencesCount: number;
  sessionLoading: boolean;
  hasCompletePreferences: boolean;
  currentPage: number;
  totalPages: number;
  isSearchTriggered: boolean;
}

interface UseTenantDashboardReturn {
  state: DashboardState;
  setSearchTerm: (term: string) => void;
  loadProperties: (search: string, page?: number) => Promise<void>;
  loadUserPreferences: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useTenantDashboard = (): UseTenantDashboardReturn => {
  const user = useSelector(selectUser);

  const [state, setState] = useState<DashboardState>({
    searchTerm: "",
    properties: [],
    matchedProperties: [],
    userPreferences: null,
    loading: false,
    error: null,
    totalCount: 0,
    preferencesCount: 0,
    sessionLoading: true,
    hasCompletePreferences: false,
    currentPage: 1,
    totalPages: 1,
    isSearchTriggered: false,
  });

  // Debounced search
  const debouncedSearchTerm = useDebounce(state.searchTerm, 300);

  // Load properties with search
  const loadProperties = useCallback(
    async (search: string, page: number = 1) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Try to load properties with search
        let response;
        try {
          response = await propertiesAPI.getPublic(page, 12, search);
        } catch (searchError) {
          console.warn("⚠️ Search failed, trying to load all properties...");
          // Fallback: load all properties without search
          response = await propertiesAPI.getPublic(page, 12);
        }

        // Extract properties from response - API returns {data: [...], total: number, ...}
        const propertiesData = response.data?.data || response.data || [];
        const totalCount = response.data?.total || propertiesData.length;

        setState((prev) => ({
          ...prev,
          properties: propertiesData,
          totalCount,
          currentPage: page,
          totalPages: response.data?.totalPages || Math.ceil(totalCount / 12),
          loading: false,
        }));

        // If no properties found, try to load featured properties as fallback
        if (propertiesData.length === 0 && !search) {
          console.log(
            "🔄 No properties found, loading featured properties as fallback..."
          );
          try {
            // Try to load any properties without filters
            const allResponse = await propertiesAPI.getAll();
            // Extract all properties data
            const allData = allResponse.data?.data || allResponse.data || [];
            if (allData.length > 0) {
              setState((prev) => ({
                ...prev,
                properties: allData,
                totalCount: allData.length,
                totalPages: Math.ceil(allData.length / 12),
              }));
              console.log(
                "✅ All properties loaded as fallback:",
                allData.length
              );
            }
          } catch (allError) {
            console.warn("⚠️ All properties fallback also failed");
          }
        }
      } catch (error: any) {
        console.error("❌ Failed to load properties:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to load properties",
          properties: [],
          totalCount: 0,
          totalPages: 1,
          loading: false,
        }));
      }
    },
    []
  );

  // Load user preferences
  const loadUserPreferences = useCallback(async () => {
    try {
      // Check if token exists before making API call
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.warn("⚠️ No token found, skipping preferences load");
        return;
      }
      const preferencesResponse = await preferencesAPI.get();
      const loadedPreferences = preferencesResponse.data;

      // Count filled preferences (rough estimate)
      let count = 0;
      let requiredFieldsCount = 0;

      if (loadedPreferences?.min_price && loadedPreferences?.max_price) {
        count++;
        requiredFieldsCount++;
      }
      if (loadedPreferences?.min_bedrooms) {
        count++;
        requiredFieldsCount++;
      }
      if (loadedPreferences?.property_type?.length > 0) count++;
      if (loadedPreferences?.lifestyle_features?.length > 0) count++;
      if (loadedPreferences?.primary_postcode) {
        count++;
        requiredFieldsCount++;
      }

      // Check if all required fields are filled (min 3 required fields)
      const isComplete = requiredFieldsCount >= 3;

      setState((prev) => ({
        ...prev,
        userPreferences: loadedPreferences,
        preferencesCount: count,
        hasCompletePreferences: isComplete,
      }));
    } catch (error: any) {
      console.error("❌ Failed to load user preferences:", error);
    }
  }, []);

  // Load matched properties from matching API
  const loadMatchedProperties = useCallback(async (limit: number = 50) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.warn("⚠️ No token found, skipping matched properties load");
        return;
      }

      console.log("🔍 Fetching matched properties with limit:", limit);
      const response = await matchingAPI.getDetailedMatches(limit);

      console.log("📡 Raw API response:", {
        hasResponse: !!response,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        isArray: Array.isArray(response?.data),
        dataLength: Array.isArray(response?.data)
          ? response.data.length
          : "N/A",
      });

      // Extract data from axios response
      // Backend returns array directly, axios wraps it in response.data
      let matchesArray: any[] = [];

      if (response?.data) {
        if (Array.isArray(response.data)) {
          matchesArray = response.data;
        } else if (
          response.data.results &&
          Array.isArray(response.data.results)
        ) {
          // Handle case where backend returns { results: [...] }
          matchesArray = response.data.results;
        }
      } else if (Array.isArray(response)) {
        matchesArray = response;
      }

      console.log("✅ Matched properties loaded:", matchesArray.length);

      if (matchesArray.length > 0) {
        const firstMatch = matchesArray[0];
        console.log("📊 First match sample:", {
          keys: Object.keys(firstMatch),
          hasProperty: !!firstMatch.property,
          hasMatchScore: "matchScore" in firstMatch,
          matchScore: firstMatch.matchScore,
          hasMatchPercentage: "matchPercentage" in firstMatch,
          matchPercentage: firstMatch.matchPercentage,
          hasCategories: !!firstMatch.categories,
          categoriesLength: firstMatch.categories?.length || 0,
        });
      }

      // Transform to MatchedProperty format
      // Backend getDetailedMatches returns: { property, matchScore, categories, matchReasons, perfectMatch }
      const matchedProperties: MatchedProperty[] = matchesArray.map(
        (match: any) => {
          // Backend returns matchScore (mapped from matchPercentage)
          // Handle both possible field names for safety
          const score = match.matchScore ?? match.matchPercentage ?? 0;

          // Ensure score is a valid number
          const finalScore =
            typeof score === "number" && !isNaN(score) && score >= 0
              ? score
              : 0;

          if (matchesArray.indexOf(match) < 3) {
            console.log(`🏠 Property ${match.property?.id || "unknown"}:`, {
              matchScore: match.matchScore,
              matchPercentage: match.matchPercentage,
              finalScore,
              hasCategories: !!match.categories,
              categoriesCount: match.categories?.length || 0,
            });
          }

          return {
            property: match.property,
            matchScore: finalScore,
            categories: match.categories || [],
          };
        }
      );

      console.log(
        `✅ Transformed ${matchedProperties.length} matched properties`
      );
      if (matchedProperties.length > 0) {
        const scores = matchedProperties
          .map((mp) => mp.matchScore)
          .filter((s) => s > 0);
        if (scores.length > 0) {
          console.log(
            `📊 Match scores: min=${Math.min(...scores)}, max=${Math.max(
              ...scores
            )}, avg=${(
              scores.reduce((a, b) => a + b, 0) / scores.length
            ).toFixed(1)}`
          );
        } else {
          console.warn(
            "⚠️ All match scores are 0! This might indicate a problem with preferences or matching calculation."
          );
        }
      }

      setState((prev) => ({
        ...prev,
        matchedProperties,
      }));
    } catch (error: any) {
      console.error("❌ Failed to load matched properties:", error);
      console.error("❌ Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      // Don't set error state - just log it, as properties can still be shown without matches
      setState((prev) => ({
        ...prev,
        matchedProperties: [],
      }));
    }
  }, []);

  // Initialize dashboard
  useEffect(() => {
    let isMounted = true;
    const initializeDashboard = async () => {
      try {
        setState((prev) => ({ ...prev, sessionLoading: true }));

        // Wait for session manager
        await waitForSessionManager();

        if (!isMounted) return;

        // Small delay to ensure token is available
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (!isMounted) return;

        // Check token before proceeding
        const token = localStorage.getItem("accessToken");

        if (!token) {
          console.warn("⚠️ No token found during dashboard initialization");
          setState((prev) => ({ ...prev, sessionLoading: false }));
          return;
        }

        // Load user preferences
        await loadUserPreferences();

        if (!isMounted) return;

        // Load matched properties (in parallel with regular properties)
        // Use a high limit to get all matched properties
        loadMatchedProperties(100).catch((err) => {
          console.error("❌ Failed to load matched properties:", err);
        });

        // Load initial properties
        await loadProperties("", 1);

        if (!isMounted) return;

        setState((prev) => ({ ...prev, sessionLoading: false }));
      } catch (error: any) {
        console.error("❌ Failed to initialize dashboard:", error);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            error: "Failed to initialize dashboard",
            sessionLoading: false,
          }));
        }
      }
    };

    if (user) {
      initializeDashboard();
    }

    return () => {
      isMounted = false;
    };
  }, [user, loadUserPreferences, loadProperties]);

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchTerm !== state.searchTerm) {
      setState((prev) => ({ ...prev, isSearchTriggered: true }));
      loadProperties(debouncedSearchTerm, 1);
    }
  }, [debouncedSearchTerm, loadProperties]);

  const setSearchTerm = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadUserPreferences(),
      loadProperties(state.searchTerm, state.currentPage),
      loadMatchedProperties(100),
    ]);
  }, [
    loadUserPreferences,
    loadProperties,
    loadMatchedProperties,
    state.searchTerm,
    state.currentPage,
  ]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    setSearchTerm,
    loadProperties,
    loadUserPreferences,
    refreshData,
    clearError,
  };
};
