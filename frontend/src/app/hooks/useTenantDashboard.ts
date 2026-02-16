import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { Property } from "../types";
import {
  propertiesAPI,
  preferencesAPI,
  matchingAPI,
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
  properties: MatchedProperty[]; // Changed to MatchedProperty[] for consistency
  matchedProperties: MatchedProperty[];
  userPreferences: any;
  loading: boolean;
  error: string | null;
  totalCount: number;
  preferencesCount: number;
  sessionLoading: boolean;
  preferencesLoading: boolean;
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
    preferencesLoading: true,
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

          // Transform to MatchedProperty format and filter out invalid items
          const matchedProperties: MatchedProperty[] = propertiesData
            .filter((p: Property) => p && p.id)
            .map((p: Property) => ({
              property: p,
              matchScore: 0,
              categories: undefined,
            }));

          setState((prev) => ({
            ...prev,
            properties: matchedProperties, // Use matchedProperties format for consistency
            matchedProperties,
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

        // Transform to MatchedProperty format and filter out invalid items
        const matchedProperties: MatchedProperty[] = propertiesData
          .map((item: any) => ({
            property: item.property,
            matchScore: item.matchScore || 0,
            categories: item.categories || [],
          }))
          .filter((item: MatchedProperty) => item && item.property && item.property.id);

        setState((prev) => ({
          ...prev,
          properties: matchedProperties, // Use matchedProperties format for consistency
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

          // Transform to MatchedProperty format and filter out invalid items
          const matchedProperties: MatchedProperty[] = propertiesData
            .filter((p: Property) => p && p.id)
            .map((p: Property) => ({
              property: p,
              matchScore: 0,
              categories: undefined,
            }));

          setState((prev) => ({
            ...prev,
            properties: matchedProperties, // Use matchedProperties format for consistency
            matchedProperties,
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

      // Enhanced preference completion calculation with weighted scoring
      let totalScore = 0;
      let maxPossibleScore = 0;
      let requiredFieldsCount = 0;

      // Essential preferences (weight: 3) - Core requirements for basic matching
      maxPossibleScore += 3; // primary_postcode
      if (loadedPreferences?.primary_postcode) {
        totalScore += 3;
        requiredFieldsCount++;
      }

      maxPossibleScore += 3; // complete price range
      if (loadedPreferences?.min_price && loadedPreferences?.max_price) {
        totalScore += 3; // Both prices set
        requiredFieldsCount++;
      } else if (loadedPreferences?.min_price || loadedPreferences?.max_price) {
        totalScore += 1.5; // Partial price range
      }

      maxPossibleScore += 3; // min_bedrooms
      if (loadedPreferences?.min_bedrooms) {
        totalScore += 3;
        requiredFieldsCount++;
      }

      // Important preferences (weight: 2) - Key property details
      maxPossibleScore += 2; // furnishing
      if (loadedPreferences?.furnishing) totalScore += 2;

      maxPossibleScore += 2; // let_duration
      if (loadedPreferences?.let_duration) totalScore += 2;

      maxPossibleScore += 2; // designer_furniture
      if (loadedPreferences?.designer_furniture !== undefined && loadedPreferences?.designer_furniture !== null) totalScore += 2;

      maxPossibleScore += 2; // house_shares
      if (loadedPreferences?.house_shares) totalScore += 2;

      // Useful preferences (weight: 1.5) - Lifestyle and feature preferences
      maxPossibleScore += 1.5; // convenience_features (array)
      const convenienceCount = loadedPreferences?.convenience_features?.length || 0;
      if (convenienceCount > 0) {
        totalScore += Math.min(convenienceCount * 0.5, 1.5); // Up to 1.5 based on selections
      }

      maxPossibleScore += 1.5; // ideal_living_environment
      if (loadedPreferences?.ideal_living_environment) totalScore += 1.5;

      maxPossibleScore += 1.5; // pets
      if (loadedPreferences?.pets) totalScore += 1.5;

      maxPossibleScore += 1.5; // smoker
      if (loadedPreferences?.smoker !== undefined && loadedPreferences?.smoker !== null) totalScore += 1.5;

      // Optional preferences (weight: 1) - Nice-to-have details
      maxPossibleScore += 1; // move_in_date
      if (loadedPreferences?.move_in_date) totalScore += 1;

      maxPossibleScore += 1; // complete bedroom range (beyond min)
      if (loadedPreferences?.max_bedrooms) totalScore += 1;

      maxPossibleScore += 1; // complete bathroom range
      if (loadedPreferences?.min_bathrooms && loadedPreferences?.max_bathrooms) {
        totalScore += 1; // Both bathroom limits set
      } else if (loadedPreferences?.min_bathrooms || loadedPreferences?.max_bathrooms) {
        totalScore += 0.5; // Partial bathroom range
      }

      maxPossibleScore += 1; // hobbies (array)
      const hobbiesCount = loadedPreferences?.hobbies?.length || 0;
      if (hobbiesCount > 0) {
        totalScore += Math.min(hobbiesCount * 0.3, 1); // Up to 1 based on selections
      }

      maxPossibleScore += 1; // additional_info
      if (loadedPreferences?.additional_info) totalScore += 1;

      maxPossibleScore += 1; // date_property_added
      if (loadedPreferences?.date_property_added) totalScore += 1;

      // Calculate percentage based on weighted score
      const preferencesPercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

      // Check if all required fields are filled (min 3 required fields)
      const isComplete = requiredFieldsCount >= 3;

      setState((prev) => ({
        ...prev,
        userPreferences: loadedPreferences,
        preferencesCount: preferencesPercentage, // Now returns percentage
        preferencesLoading: false,
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

  // Handle debounced search: when debounced value changes, reload list (skip initial mount – init already loads)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setState((prev) => ({ ...prev, isSearchTriggered: true }));
    loadProperties(debouncedSearchTerm, 1);
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
