import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { shortlistAPI } from "../../lib/api";
import { Property } from "../../types";

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
  async (_, { rejectWithValue }) => {
    try {
      const properties = await shortlistAPI.getAll();
      return properties;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch shortlist");
    }
  }
);

export const addToShortlist = createAsyncThunk(
  "shortlist/addToShortlist",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      await shortlistAPI.add(propertyId);
      return propertyId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add to shortlist");
    }
  }
);

export const removeFromShortlist = createAsyncThunk(
  "shortlist/removeFromShortlist",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      await shortlistAPI.remove(propertyId);
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
  async (_, { rejectWithValue }) => {
    try {
      await shortlistAPI.clear();
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to clear shortlist");
    }
  }
);

export const fetchShortlistCount = createAsyncThunk(
  "shortlist/fetchShortlistCount",
  async (_, { rejectWithValue }) => {
    try {
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
        (state, action: PayloadAction<string>) => {
          state.count += 1;
          // Note: We don't add the property to the list here because we don't have full property data
          // The property will be added when we refetch the shortlist
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
