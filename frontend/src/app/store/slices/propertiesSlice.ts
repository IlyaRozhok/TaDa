import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface PropertyRow {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnishing: string;
  lifestyle_features: string[];
  available_from: string;
  images: string[];
  is_btr: boolean;
  operator_id: string;
  created_at: string;
  updated_at: string;
  operator?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface CreatePropertyData {
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnishing: string;
  lifestyle_features: string[];
  available_from: string;
  is_btr: boolean;
  operator_id: string;
}

export interface UpdatePropertyData {
  title?: string;
  description?: string;
  address?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string;
  furnishing?: string;
  lifestyle_features?: string[];
  available_from?: string;
  is_btr?: boolean;
  operator_id?: string;
}

interface PropertiesState {
  properties: PropertyRow[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  updating: boolean;
  updateError: string | null;
  deleting: boolean;
  deleteError: string | null;
}

const initialState: PropertiesState = {
  properties: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  error: null,
  creating: false,
  createError: null,
  updating: false,
  updateError: null,
  deleting: false,
  deleteError: null,
};

// Async thunk for fetching properties
export const fetchProperties = createAsyncThunk(
  "properties/fetchProperties",
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

      const url = `${API_BASE_URL}/properties?${queryParams}`;
      console.log("fetchProperties: Making request to:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("fetchProperties: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("fetchProperties: API error", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        return rejectWithValue(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("fetchProperties: Success", {
        totalProperties: data.total,
        returnedProperties: data.data?.length || 0,
      });

      return data;
    } catch (error) {
      console.error("fetchProperties: Network or parsing error", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for creating property
export const createProperty = createAsyncThunk(
  "properties/createProperty",
  async (propertyData: CreatePropertyData, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to create property"
        );
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for updating property
export const updateProperty = createAsyncThunk(
  "properties/updateProperty",
  async (
    { id, propertyData }: { id: string; propertyData: UpdatePropertyData },
    { getState, rejectWithValue }
  ) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to update property"
        );
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for deleting property
export const deleteProperty = createAsyncThunk(
  "properties/deleteProperty",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to delete property"
        );
      }

      return { id };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

const propertiesSlice = createSlice({
  name: "properties",
  initialState,
  reducers: {
    clearCreateError: (state) => {
      state.createError = null;
    },
    clearUpdateError: (state) => {
      state.updateError = null;
    },
    clearDeleteError: (state) => {
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch properties
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProperties.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.properties = action.payload.data || [];
          state.total = action.payload.total || 0;
          state.page = action.payload.page || 1;
          state.totalPages = action.payload.totalPages || 1;
        }
      )
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch properties";
      });

    // Create property
    builder
      .addCase(createProperty.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createProperty.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.creating = false;
        state.createError =
          (action.payload as string) || "Failed to create property";
      });

    // Update property
    builder
      .addCase(updateProperty.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateProperty.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          (action.payload as string) || "Failed to update property";
      });

    // Delete property
    builder
      .addCase(deleteProperty.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteProperty.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError =
          (action.payload as string) || "Failed to delete property";
      });
  },
});

export const { clearCreateError, clearUpdateError, clearDeleteError } =
  propertiesSlice.actions;
export default propertiesSlice.reducer;
