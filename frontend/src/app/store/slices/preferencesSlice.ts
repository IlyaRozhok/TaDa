import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface PreferencesRow {
  id: string;
  user_id: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    roles: string[];
  };
  primary_postcode?: string;
  secondary_location?: string;
  commute_location?: string;
  commute_time_walk?: number;
  commute_time_cycle?: number;
  commute_time_tube?: number;
  move_in_date?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  furnishing?: string;
  let_duration?: string;
  property_type?: string;
  building_style?: string[];
  designer_furniture?: boolean;
  house_shares?: string;
  date_property_added?: string;
  lifestyle_features?: string[];
  social_features?: string[];
  work_features?: string[];
  convenience_features?: string[];
  pet_friendly_features?: string[];
  luxury_features?: string[];
  hobbies?: string[];
  ideal_living_environment?: string;
  pets?: string;
  smoker?: boolean;
  additional_info?: string;
  created_at: string;
  updated_at: string;
}

interface PreferencesState {
  preferences: PreferencesRow[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: PreferencesState = {
  preferences: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  error: null,
};

// Async thunk for fetching all preferences (admin only)
export const fetchAllPreferences = createAsyncThunk(
  "preferences/fetchAll",
  async (
    params: { page: number; limit: number; search?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      if (!token) {
        return rejectWithValue("No authentication token available");
      }

      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
      });

      if (params.search) {
        queryParams.append("search", params.search);
      }

      const url = `${API_BASE_URL}/preferences/all?${queryParams}`;
      console.log("fetchAllPreferences: Making request to:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("fetchAllPreferences: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("fetchAllPreferences: API error", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        return rejectWithValue(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("fetchAllPreferences: Success", {
        totalPreferences: data.total,
        returnedPreferences: data.data?.length || 0,
      });

      return data;
    } catch (error) {
      console.error("fetchAllPreferences: Network or parsing error", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for updating user preferences (admin only)
export const updateUserPreferences = createAsyncThunk(
  "preferences/updateUser",
  async (
    params: { userId: string; preferences: Partial<PreferencesRow> },
    { getState, rejectWithValue }
  ) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      if (!token) {
        return rejectWithValue("No authentication token available");
      }

      const url = `${API_BASE_URL}/preferences/admin/${params.userId}`;
      console.log("updateUserPreferences: Making request to:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params.preferences),
      });

      console.log("updateUserPreferences: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("updateUserPreferences: API error", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        return rejectWithValue(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("updateUserPreferences: Success", data);

      return data;
    } catch (error) {
      console.error("updateUserPreferences: Network or parsing error", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for clearing user preferences (admin only)
export const clearUserPreferences = createAsyncThunk(
  "preferences/clearUser",
  async (params: { userId: string }, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      if (!token) {
        return rejectWithValue("No authentication token available");
      }

      const url = `${API_BASE_URL}/preferences/admin/${params.userId}`;
      console.log("clearUserPreferences: Making request to:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("clearUserPreferences: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("clearUserPreferences: API error", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        return rejectWithValue(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      console.log("clearUserPreferences: Success");

      return { userId: params.userId };
    } catch (error) {
      console.error("clearUserPreferences: Network or parsing error", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all preferences
    builder
      .addCase(fetchAllPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllPreferences.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.preferences = action.payload.data || [];
          state.total = action.payload.total || 0;
          state.page = action.payload.page || 1;
          state.totalPages = action.payload.totalPages || 1;
        }
      )
      .addCase(fetchAllPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch preferences";
      })
      // Update user preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateUserPreferences.fulfilled,
        (state, action: PayloadAction<PreferencesRow>) => {
          state.loading = false;
          // Update the specific preference in the list
          const index = state.preferences.findIndex(
            (pref) => pref.id === action.payload.id
          );
          if (index !== -1) {
            state.preferences[index] = action.payload;
          }
        }
      )
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to update preferences";
      })
      // Clear user preferences
      .addCase(clearUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        clearUserPreferences.fulfilled,
        (state, action: PayloadAction<{ userId: string }>) => {
          state.loading = false;
          // Find and update the preference to have all null values
          const index = state.preferences.findIndex(
            (pref) => pref.user_id === action.payload.userId
          );
          if (index !== -1) {
            const clearedPreference = {
              ...state.preferences[index],
              primary_postcode: null,
              secondary_location: null,
              commute_location: null,
              commute_time_walk: null,
              commute_time_cycle: null,
              commute_time_tube: null,
              move_in_date: null,
              min_price: null,
              max_price: null,
              min_bedrooms: null,
              max_bedrooms: null,
              min_bathrooms: null,
              max_bathrooms: null,
              furnishing: null,
              let_duration: null,
              property_type: null,
              building_style: null,
              designer_furniture: null,
              house_shares: null,
              date_property_added: null,
              lifestyle_features: null,
              social_features: null,
              work_features: null,
              convenience_features: null,
              pet_friendly_features: null,
              luxury_features: null,
              hobbies: null,
              ideal_living_environment: null,
              pets: null,
              smoker: null,
              additional_info: null,
            };
            state.preferences[index] = clearedPreference;
          }
        }
      )
      .addCase(clearUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to clear preferences";
      });
  },
});

export const { clearError } = preferencesSlice.actions;
export default preferencesSlice.reducer;
