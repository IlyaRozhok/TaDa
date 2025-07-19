import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";

interface RootState {
  auth: {
    accessToken: string | null;
  };
}

export interface DashboardCounts {
  propertiesCount: number;
  tenantsCount: number;
  matchesCount: number;
}

export interface TenantRow {
  id: string;
  full_name: string;
  email: string;
  preferences?: {
    id: string;
    min_price?: number;
    max_price?: number;
    min_bedrooms?: number;
    max_bedrooms?: number;
    property_type?: string;
    primary_postcode?: string;
    secondary_location?: string;
    lifestyle_features?: string[];
    furnishing?: string;
  };
}

export interface OperatorProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
}

interface OperatorState {
  dashboardCounts: DashboardCounts | null;
  tenants: TenantRow[];
  properties: OperatorProperty[];
  loading: boolean;
  error: string | null;
  suggestingProperty: boolean;
  suggestPropertyError: string | null;
  // Добавляем флаги для отслеживания загрузки каждого типа данных
  dashboardCountsLoaded: boolean;
  tenantsLoaded: boolean;
  propertiesLoaded: boolean;
  lastFetchTime: {
    dashboardCounts: number | null;
    tenants: number | null;
    properties: number | null;
  };
}

const initialState: OperatorState = {
  dashboardCounts: null,
  tenants: [],
  properties: [],
  loading: false,
  error: null,
  suggestingProperty: false,
  suggestPropertyError: null,
  dashboardCountsLoaded: false,
  tenantsLoaded: false,
  propertiesLoaded: false,
  lastFetchTime: {
    dashboardCounts: null,
    tenants: null,
    properties: null,
  },
};

// Async thunks
export const fetchDashboardCounts = createAsyncThunk(
  "operator/fetchDashboardCounts",
  async (_, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      if (!token) {
        return rejectWithValue("No authentication token available");
      }

      const response = await fetch(`${API_BASE_URL}/operator/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch dashboard counts";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Если не удается распарсить JSON, используем статус код
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        return rejectWithValue(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard counts"
      );
    }
  }
);

export const fetchTenants = createAsyncThunk(
  "operator/fetchTenants",
  async (_, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      if (!token) {
        return rejectWithValue("No authentication token available");
      }

      const response = await fetch(`${API_BASE_URL}/operator/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch tenants");
      }

      return response.json();
    } catch (error: any) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch tenants"
      );
    }
  }
);

export const fetchOperatorProperties = createAsyncThunk(
  "operator/fetchOperatorProperties",
  async (_, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      if (!token) {
        return rejectWithValue("No authentication token available");
      }

      const response = await fetch(`${API_BASE_URL}/operator/properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to fetch properties"
        );
      }

      return response.json();
    } catch (error: any) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch properties"
      );
    }
  }
);

export const suggestProperty = createAsyncThunk(
  "operator/suggestProperty",
  async (
    { tenantId, propertyId }: { tenantId: string; propertyId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      if (!token) {
        return rejectWithValue("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/operator/suggest-property`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenantId,
            propertyId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to suggest property"
        );
      }

      return response.json();
    } catch (error: any) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to suggest property"
      );
    }
  }
);

// Константы для кэширования
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Базовый селектор для operator state
const selectOperatorState = (state: { operator: OperatorState }) =>
  state.operator;

// Мемоизированные селекторы для проверки состояния загрузки
export const selectShouldFetchDashboardCounts = createSelector(
  [selectOperatorState],
  (operatorState) => {
    const { dashboardCountsLoaded, loading, lastFetchTime } = operatorState;

    console.log("🔍 selectShouldFetchDashboardCounts:", {
      loading,
      dashboardCountsLoaded,
      lastFetch: lastFetchTime.dashboardCounts,
    });

    if (loading) return false;
    if (!dashboardCountsLoaded) return true;

    const lastFetch = lastFetchTime.dashboardCounts;
    if (!lastFetch) return true;

    const shouldFetch = Date.now() - lastFetch > CACHE_DURATION;
    console.log("📊 Dashboard counts cache check:", {
      shouldFetch,
      age: Date.now() - lastFetch,
    });
    return shouldFetch;
  }
);

export const selectShouldFetchTenants = createSelector(
  [selectOperatorState],
  (operatorState) => {
    const { tenantsLoaded, loading, lastFetchTime } = operatorState;

    console.log("🔍 selectShouldFetchTenants:", {
      loading,
      tenantsLoaded,
      lastFetch: lastFetchTime.tenants,
    });

    if (loading) return false;
    if (!tenantsLoaded) return true;

    const lastFetch = lastFetchTime.tenants;
    if (!lastFetch) return true;

    const shouldFetch = Date.now() - lastFetch > CACHE_DURATION;
    console.log("👥 Tenants cache check:", {
      shouldFetch,
      age: Date.now() - lastFetch,
    });
    return shouldFetch;
  }
);

export const selectShouldFetchProperties = createSelector(
  [selectOperatorState],
  (operatorState) => {
    const { propertiesLoaded, loading, lastFetchTime } = operatorState;

    console.log("🔍 selectShouldFetchProperties:", {
      loading,
      propertiesLoaded,
      lastFetch: lastFetchTime.properties,
    });

    if (loading) return false;
    if (!propertiesLoaded) return true;

    const lastFetch = lastFetchTime.properties;
    if (!lastFetch) return true;

    const shouldFetch = Date.now() - lastFetch > CACHE_DURATION;
    console.log("🏠 Properties cache check:", {
      shouldFetch,
      age: Date.now() - lastFetch,
    });
    return shouldFetch;
  }
);

// Простые прокси-функции для вызова оригинальных thunks
export const fetchDashboardCountsIfNeeded = fetchDashboardCounts;
export const fetchTenantsIfNeeded = fetchTenants;
export const fetchOperatorPropertiesIfNeeded = fetchOperatorProperties;

const operatorSlice = createSlice({
  name: "operator",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.suggestPropertyError = null;
    },
    resetLoadedFlags: (state) => {
      state.dashboardCountsLoaded = false;
      state.tenantsLoaded = false;
      state.propertiesLoaded = false;
      state.lastFetchTime = {
        dashboardCounts: null,
        tenants: null,
        properties: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard counts
      .addCase(fetchDashboardCounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardCounts = action.payload;
        state.dashboardCountsLoaded = true;
        state.lastFetchTime.dashboardCounts = Date.now();
      })
      .addCase(fetchDashboardCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Tenants
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants = action.payload;
        state.tenantsLoaded = true;
        state.lastFetchTime.tenants = Date.now();
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Properties
      .addCase(fetchOperatorProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOperatorProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload;
        state.propertiesLoaded = true;
        state.lastFetchTime.properties = Date.now();
      })
      .addCase(fetchOperatorProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Suggest property
      .addCase(suggestProperty.pending, (state) => {
        state.suggestingProperty = true;
        state.suggestPropertyError = null;
      })
      .addCase(suggestProperty.fulfilled, (state) => {
        state.suggestingProperty = false;
      })
      .addCase(suggestProperty.rejected, (state, action) => {
        state.suggestingProperty = false;
        state.suggestPropertyError = action.payload as string;
      });
  },
});

export const { clearErrors, resetLoadedFlags } = operatorSlice.actions;
export default operatorSlice.reducer;
