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

  // Load properties with search - now uses matched properties endpoint
  const loadProperties = useCallback(
    async (search: string, page: number = 1) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Check if token exists - if not, fallback to public endpoint
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.warn("⚠️ No token found, using public endpoint");
          // Fallback to public endpoint if no token
          let response;
          try {
            response = await propertiesAPI.getPublic(page, 12, search);
          } catch (searchError) {
            console.warn("⚠️ Search failed, trying to load all properties...");
            response = await propertiesAPI.getPublic(page, 12);
          }

          const propertiesData = response.data?.data || response.data || [];
          const totalCount = response.data?.total || propertiesData.length;

          setState((prev) => ({
            ...prev,
            properties: propertiesData,
            matchedProperties: propertiesData.map((p: Property) => ({
              property: p,
              matchScore: 0,
              categories: undefined,
            })),
            totalCount,
            currentPage: page,
            totalPages: response.data?.totalPages || Math.ceil(totalCount / 12),
            loading: false,
          }));
          return;
        }

        // Use matched properties endpoint which calculates matching on backend
        const response = await matchingAPI.getMatchedPropertiesWithPagination(
          page,
          12,
          search
        );

        // Extract data from response
        const responseData = response.data || response;
        const propertiesData = responseData.data || [];
        const totalCount = responseData.total || propertiesData.length;

        // Transform to MatchedProperty format
        const matchedProperties: MatchedProperty[] = propertiesData.map(
          (item: any) => ({
            property: item.property,
            matchScore: item.matchScore || 0,
            categories: item.categories || [],
          })
        );

        setState((prev) => ({
          ...prev,
          properties: propertiesData.map((item: any) => item.property),
          matchedProperties,
          totalCount,
          currentPage: page,
          totalPages: responseData.totalPages || Math.ceil(totalCount / 12),
          loading: false,
        }));
      } catch (error: any) {
        console.error("❌ Failed to load properties:", error);
        // Fallback to public endpoint on error
        try {
          const fallbackResponse = await propertiesAPI.getPublic(page, 12, search);
          const propertiesData =
            fallbackResponse.data?.data || fallbackResponse.data || [];
          const totalCount =
            fallbackResponse.data?.total || propertiesData.length;

          setState((prev) => ({
            ...prev,
            properties: propertiesData,
            matchedProperties: propertiesData.map((p: Property) => ({
              property: p,
              matchScore: 0,
              categories: undefined,
            })),
            totalCount,
            currentPage: page,
            totalPages:
              fallbackResponse.data?.totalPages || Math.ceil(totalCount / 12),
            loading: false,
          }));
        } catch (fallbackError) {
          setState((prev) => ({
            ...prev,
            error: "Failed to load properties",
            properties: [],
            matchedProperties: [],
            totalCount: 0,
            totalPages: 1,
            loading: false,
          }));
        }
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

  // Note: Matched properties are now loaded together with properties in loadProperties
  // No need for separate loadMatchedProperties function

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

        // Load properties with matching (now calculated on backend)
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
    ]);
  }, [
    loadUserPreferences,
    loadProperties,
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
