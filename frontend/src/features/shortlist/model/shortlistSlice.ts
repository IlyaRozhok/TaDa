import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { shortlistAPI } from "@/app/lib/api";
import { Property } from "@/app/types";

interface ShortlistState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  count: number;
}

const initialState: ShortlistState = {
  properties: [],
  loading: false,
  error: null,
  lastFetch: null,
  count: 0,
};

// Async thunks
export const fetchShortlist = createAsyncThunk(
  "shortlist/fetchShortlist",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check user role before making API call
      const state = getState() as { auth: { user: { role?: string } | null } };
      const user = state?.auth?.user;

      if (!user || (user.role !== "tenant" && user.role !== "admin")) {
        console.warn("Shortlist fetch blocked: user is not a tenant or admin");
        return []; // Return empty array for non-tenants/non-admins
      }

      const data = await shortlistAPI.getAll();
      return data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch shortlist");
    }
  }
);

export const addToShortlist = createAsyncThunk(
  "shortlist/addToShortlist",
  async (
    { propertyId, property }: { propertyId: string; property?: Property },
    { rejectWithValue, getState }
  ) => {
    try {
      // Check user role before making API call
      const state = getState() as { auth: { user: { role?: string } | null } };
      const user = state?.auth?.user;

      if (!user || (user.role !== "tenant" && user.role !== "admin")) {
        console.warn("Add to shortlist blocked: user is not a tenant or admin");
        return rejectWithValue("Only tenants and admins can add properties to shortlist");
      }

      const data = await shortlistAPI.add(propertyId);
      console.log("Add to shortlist response:", data);

      // Return both the property ID and the property data (if available)
      return { propertyId, property };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add to shortlist");
    }
  }
);

export const removeFromShortlist = createAsyncThunk(
  "shortlist/removeFromShortlist",
  async (propertyId: string, { rejectWithValue, getState }) => {
    try {
      // Check user role before making API call
      const state = getState() as { auth: { user: { role?: string } | null } };
      const user = state?.auth?.user;

      if (!user || (user.role !== "tenant" && user.role !== "admin")) {
        console.warn("Remove from shortlist blocked: user is not a tenant or admin");
        return rejectWithValue(
          "Only tenants and admins can remove properties from shortlist"
        );
      }

      const data = await shortlistAPI.remove(propertyId);
      console.log("Remove from shortlist response:", data);
      return propertyId;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to remove from shortlist"
      );
    }
  }
);

export const clearShortlist = createAsyncThunk(
  "shortlist/clearShortlist",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check user role before making API call
      const state = getState() as { auth: { user: { role?: string } | null } };
      const user = state?.auth?.user;

      if (!user || (user.role !== "tenant" && user.role !== "admin")) {
        console.warn("Clear shortlist blocked: user is not a tenant or admin");
        return rejectWithValue("Only tenants and admins can clear shortlist");
      }

      const data = await shortlistAPI.clear();
      console.log("Clear shortlist response:", data);
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to clear shortlist");
    }
  }
);

export const fetchShortlistCount = createAsyncThunk(
  "shortlist/fetchShortlistCount",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check user role before making API call
      const state = getState() as { auth: { user: { role?: string } | null } };
      const user = state?.auth?.user;

      if (!user || (user.role !== "tenant" && user.role !== "admin")) {
        console.warn("Shortlist count fetch blocked: user is not a tenant or admin");
        return 0; // Return 0 for non-tenants/non-admins
      }

      const count = await shortlistAPI.getCount();
      return count;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch shortlist count"
      );
    }
  }
);

const shortlistSlice = createSlice({
  name: "shortlist",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetShortlist: (state) => {
      state.properties = [];
      state.loading = false;
      state.error = null;
      state.lastFetch = null;
      state.count = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch shortlist
    builder
      .addCase(fetchShortlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchShortlist.fulfilled,
        (state, action: PayloadAction<Property[]>) => {
          state.loading = false;
          state.properties = action.payload;
          state.count = action.payload.length;
          state.lastFetch = Date.now();
        }
      )
      .addCase(fetchShortlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add to shortlist
    builder
      .addCase(addToShortlist.pending, (state) => {
        state.error = null;
      })
      .addCase(
        addToShortlist.fulfilled,
        (
          state,
          action: PayloadAction<{ propertyId: string; property?: Property }>
        ) => {
          const { propertyId, property } = action.payload;

          // Check if property is already in shortlist (avoid duplicates)
          const exists = state.properties.some((p) => p.id === propertyId);
          if (!exists) {
            state.count += 1;

            // If property data is available, add it to the list immediately
            if (property) {
              state.properties.push(property);
            }
            // If no property data, it will be added when we refetch the shortlist
          }
        }
      )
      .addCase(addToShortlist.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Remove from shortlist
    builder
      .addCase(removeFromShortlist.pending, (state) => {
        state.error = null;
      })
      .addCase(
        removeFromShortlist.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.properties = state.properties.filter(
            (p) => p.id !== action.payload
          );
          state.count = Math.max(0, state.count - 1);
        }
      )
      .addCase(removeFromShortlist.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Clear shortlist
    builder
      .addCase(clearShortlist.pending, (state) => {
        state.error = null;
      })
      .addCase(clearShortlist.fulfilled, (state) => {
        state.properties = [];
        state.count = 0;
      })
      .addCase(clearShortlist.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch shortlist count
    builder.addCase(
      fetchShortlistCount.fulfilled,
      (state, action: PayloadAction<number>) => {
        state.count = action.payload;
      }
    );
  },
});

export const { clearError, resetShortlist } = shortlistSlice.actions;

// Selectors
export const selectShortlist = (state: { shortlist: ShortlistState }) =>
  state.shortlist;
export const selectShortlistProperties = (state: {
  shortlist: ShortlistState;
}) => state.shortlist.properties;
export const selectShortlistLoading = (state: { shortlist: ShortlistState }) =>
  state.shortlist.loading;
export const selectShortlistError = (state: { shortlist: ShortlistState }) =>
  state.shortlist.error;
export const selectShortlistCount = (state: { shortlist: ShortlistState }) =>
  state.shortlist.count;

export default shortlistSlice.reducer;
