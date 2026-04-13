import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Property } from "../types";
import {
  propertiesAPI,
  preferencesAPI,
  matchingAPI,
  CategoryMatchResult,
} from "../lib/api";
import { selectUser } from "@/store/slices/authSlice";
import { apiSlice } from "@/store/slices/apiSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { useDebounce } from "./useDebounce";
import { waitForSessionManager } from "../components/providers/SessionManager";
import { store } from "@/store/store";
import { hasPreferencesLocationFilled } from "../../entities/preferences/model/preferences";

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
  /** Number of preference fields that have a value (for badge display) */
  preferencesFilledCount: number;
  sessionLoading: boolean;
  preferencesLoading: boolean;
  hasCompletePreferences: boolean;
  currentPage: number;
  totalPages: number;
  isSearchTriggered: boolean;
  /** True when first render of this hook was hydrated from RTK Query cache (used to skip UI loaders on back nav). */
  hydratedFromCache: boolean;
}

interface UseTenantDashboardReturn {
  state: DashboardState;
  setSearchTerm: (term: string) => void;
  loadProperties: (search: string, page?: number) => Promise<void>;
  loadUserPreferences: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

interface UseTenantDashboardOptions {
  useMatchedProperties?: boolean;
  useFullCountForHeader?: boolean;
  /** Persist search/page between navigations (sessionStorage key). */
  persistenceKey?: string;
}

export const useTenantDashboard = (
  options: UseTenantDashboardOptions = {},
): UseTenantDashboardReturn => {
  const {
    useMatchedProperties = true,
    useFullCountForHeader = false,
    persistenceKey,
  } = options;
  const user = useSelector(selectUser);
  const dispatch = useDispatch<AppDispatch>();
  const persistedStateRef = useRef<{ searchTerm: string; currentPage: number } | null>(
    null,
  );

  if (persistedStateRef.current === null && persistenceKey && typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(persistenceKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          searchTerm?: string;
          currentPage?: number;
        };
        persistedStateRef.current = {
          searchTerm: parsed.searchTerm ?? "",
          currentPage:
            typeof parsed.currentPage === "number" && parsed.currentPage > 0
              ? parsed.currentPage
              : 1,
        };
      }
    } catch {
      persistedStateRef.current = null;
    }
  }

  // Seed initial state from RTK Query cache when available
  const cachedInitial = useSelector((state: RootState) =>
    useMatchedProperties
      ? apiSlice.endpoints.getMatchedPropertiesPaginated.select({
          page: 1,
          limit: 12,
          search: "",
        })(state)
      : apiSlice.endpoints.getPublicPropertiesPaginated.select({
          page: 1,
          limit: 12,
          search: "",
        })(state),
  );

  const [state, setState] = useState<DashboardState>(() => {
    const cachedData = cachedInitial?.data;

    let initialMatched: MatchedProperty[] = [];
    let totalCount = 0;
    let totalPages = 1;

    if (cachedData && Array.isArray(cachedData.data)) {
      const propertiesData = cachedData.data;
      totalCount = cachedData.total || propertiesData.length;
      totalPages = cachedData.totalPages || Math.ceil(totalCount / 12);

      initialMatched = propertiesData
        .map((item: any) =>
          useMatchedProperties
            ? {
                property: item.property,
                matchScore: item.matchScore ?? item.matchPercentage ?? 0,
                categories: item.categories || [],
              }
            : {
                property: item,
                matchScore: 0,
                categories: [],
              },
        )
        .filter(
          (item: MatchedProperty) =>
            item && item.property && item.property.id,
        );
    }

    return {
      searchTerm: persistedStateRef.current?.searchTerm ?? "",
      properties: initialMatched,
      matchedProperties: initialMatched,
      userPreferences: null,
      loading: !cachedData, // если есть кэш – сразу без скелетона
      error: null,
      totalCount,
      preferencesCount: 0,
      preferencesFilledCount: 0,
      sessionLoading: true,
      preferencesLoading: true,
      hasCompletePreferences: false,
      currentPage: persistedStateRef.current?.currentPage ?? 1,
      totalPages,
      isSearchTriggered: false,
      hydratedFromCache: !!cachedData,
    };
  });

  // Debounced search
  const debouncedSearchTerm = useDebounce(state.searchTerm, 300);

  // Load properties with search - now uses matched properties endpoint
  const loadProperties = useCallback(
    async (search: string, page: number = 1) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const { user: authUser, isAuthenticated } = store.getState().auth;
        const hasAuthSession = !!authUser?.id && isAuthenticated;

        const loadPublicListFromCacheableEndpoint = async () => {
          const responseData = await dispatch(
            apiSlice.endpoints.getPublicPropertiesPaginated.initiate({
              page,
              limit: 12,
              search,
            }),
          ).unwrap();

          const propertiesData = responseData.data || responseData || [];
          const totalCount = responseData.total || propertiesData.length;

          const matchedProperties: MatchedProperty[] = propertiesData
            .filter((p: Property) => p && p.id)
            .map((p: Property) => ({
              property: p,
              matchScore: 0,
              categories: undefined,
            }));

          setState((prev) => ({
            ...prev,
            properties: matchedProperties,
            matchedProperties,
            totalCount,
            currentPage: page,
            totalPages: responseData.totalPages || Math.ceil(totalCount / 12),
            loading: false,
          }));
        };

        // No Redux session → public list only
        if (!hasAuthSession) {
          console.warn("⚠️ No auth session, using public endpoint");
          let response;
          let rtkPublicListError: unknown;
          try {
            await loadPublicListFromCacheableEndpoint();
            return;
          } catch (searchError) {
            rtkPublicListError = searchError;
            console.warn(
              "⚠️ Cached public endpoint failed, trying axios fallback...",
            );
          }

          try {
            response = await propertiesAPI.getPublic(page, 12);
          } catch {
            throw rtkPublicListError;
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

        let propertiesData: any[] = [];
        let totalCount = 0;
        let totalPages = 1;

        if (useMatchedProperties) {
          // Use matched properties endpoint via RTK Query, which provides caching
          const responseData = await dispatch(
            apiSlice.endpoints.getMatchedPropertiesPaginated.initiate({
              page,
              limit: 12,
              search,
            }),
          ).unwrap();

          propertiesData = responseData.data || [];
          totalCount = responseData.total || propertiesData.length;
          totalPages = responseData.totalPages || Math.ceil(totalCount / 12);

          // Keep match-scored dataset, but show full inventory count in header when requested.
          if (useFullCountForHeader) {
            try {
              const fullCountResponse = await propertiesAPI.getPublic(
                1,
                1,
                search,
              );
              const fullCount =
                fullCountResponse.data?.total ??
                (Array.isArray(fullCountResponse.data?.data)
                  ? fullCountResponse.data.data.length
                  : undefined);
              if (typeof fullCount === "number" && fullCount >= 0) {
                totalCount = fullCount;
              }
            } catch (countError) {
              console.warn("⚠️ Failed to fetch full properties count:", countError);
            }
          }
        } else {
          // Full catalog: use RTK Query for cache on /app/units.
          const responseData = await dispatch(
            apiSlice.endpoints.getPublicPropertiesPaginated.initiate({
              page,
              limit: 12,
              search,
            }),
          ).unwrap();
          propertiesData = responseData.data || responseData || [];
          totalCount = responseData.total ?? propertiesData.length;
          totalPages = responseData.totalPages || Math.ceil(totalCount / 12);
        }

        // Transform to MatchedProperty format and filter out invalid items.
        const matchedProperties: MatchedProperty[] = propertiesData
          .map((item: any) =>
            useMatchedProperties
              ? {
                  property: item.property,
                  matchScore: item.matchScore ?? item.matchPercentage ?? 0,
                  categories: item.categories || [],
                }
              : {
                  property: item,
                  matchScore: 0,
                  categories: [],
                },
          )
          .filter((item: MatchedProperty) => item && item.property && item.property.id);

        setState((prev) => ({
          ...prev,
          properties: matchedProperties, // Use matchedProperties format for consistency
          matchedProperties,
          totalCount,
          currentPage: page,
          totalPages,
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
    [dispatch, useMatchedProperties, useFullCountForHeader]
  );

  // Load user preferences
  const loadUserPreferences = useCallback(async () => {
    try {
      const { user: authUser, isAuthenticated } = store.getState().auth;
      const hasSession = !!authUser?.id && isAuthenticated;

      if (!hasSession) {
        console.warn("⚠️ No session, skipping preferences load");
        return;
      }
      const preferencesResponse = await preferencesAPI.get();
      const loadedPreferences = preferencesResponse.data;

      // Enhanced preference completion calculation with weighted scoring
      let totalScore = 0;
      let maxPossibleScore = 0;
      let requiredFieldsCount = 0;

      // Essential preferences (weight: 3) - location (preferred address / areas / metro)
      maxPossibleScore += 3;
      if (
        loadedPreferences &&
        hasPreferencesLocationFilled(
          loadedPreferences as Record<string, unknown>,
        )
      ) {
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

      // Calculate percentage based on weighted score
      const preferencesPercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

      // Count filled fields (one per logical field with a value) for badge display
      let filledCount = 0;
      if (
        loadedPreferences &&
        hasPreferencesLocationFilled(
          loadedPreferences as Record<string, unknown>,
        )
      )
        filledCount += 1;
      if (loadedPreferences?.min_price != null || loadedPreferences?.max_price != null) filledCount += 1;
      if (loadedPreferences?.min_bedrooms != null) filledCount += 1;
      if (loadedPreferences?.furnishing) filledCount += 1;
      if (loadedPreferences?.let_duration) filledCount += 1;
      if (loadedPreferences?.designer_furniture !== undefined && loadedPreferences?.designer_furniture !== null) filledCount += 1;
      if (loadedPreferences?.ideal_living_environment) filledCount += 1;
      if (loadedPreferences?.pets) filledCount += 1;
      if (loadedPreferences?.smoker !== undefined && loadedPreferences?.smoker !== null) filledCount += 1;
      if (loadedPreferences?.move_in_date) filledCount += 1;
      if (loadedPreferences?.max_bedrooms != null) filledCount += 1;
      if (loadedPreferences?.min_bathrooms != null || loadedPreferences?.max_bathrooms != null) filledCount += 1;
      if ((loadedPreferences?.hobbies?.length ?? 0) > 0) filledCount += 1;
      if (loadedPreferences?.additional_info) filledCount += 1;

      // Check if all required fields are filled (min 3 required fields)
      const isComplete = requiredFieldsCount >= 3;

      setState((prev) => ({
        ...prev,
        userPreferences: loadedPreferences,
        preferencesCount: preferencesPercentage, // Now returns percentage
        preferencesFilledCount: filledCount,
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

        await new Promise((resolve) => setTimeout(resolve, 200));

        if (!isMounted) return;

        const { user: authUser, isAuthenticated } = store.getState().auth;
        const hasSession = !!authUser?.id && isAuthenticated;

        if (!hasSession) {
          console.warn("⚠️ No session during dashboard initialization");
          setState((prev) => ({ ...prev, sessionLoading: false }));
          return;
        }

        // Load user preferences
        await loadUserPreferences();

        if (!isMounted) return;

        const initialSearch = persistedStateRef.current?.searchTerm ?? "";
        const initialPage = persistedStateRef.current?.currentPage ?? 1;
        await loadProperties(initialSearch, initialPage);

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

  useEffect(() => {
    if (!persistenceKey || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        persistenceKey,
        JSON.stringify({
          searchTerm: state.searchTerm,
          currentPage: state.currentPage,
        }),
      );
    } catch {
      // Ignore storage failures to avoid affecting dashboard behavior.
    }
  }, [persistenceKey, state.searchTerm, state.currentPage]);

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
