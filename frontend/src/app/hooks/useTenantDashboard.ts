import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Property } from "../types";
import { propertiesAPI, preferencesAPI } from "../lib/api";
import { selectUser } from "../store/slices/authSlice";
import { useDebounce } from "./useDebounce";
import { waitForSessionManager } from "../components/providers/SessionManager";

interface MatchedProperty {
  property: Property;
  matchScore: number;
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

        if (!isMounted) return;

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
