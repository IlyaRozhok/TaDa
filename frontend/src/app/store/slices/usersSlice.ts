import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  created_at: string;
}

export interface CreateUserData {
  full_name?: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  roles?: string[];
}

interface UsersState {
  users: UserRow[];
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

const initialState: UsersState = {
  users: [],
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

// Async thunk for fetching users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      order?: "ASC" | "DESC";
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = "created_at",
        order = "DESC",
      } = params;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      console.log("fetchUsers: Starting request", {
        params,
        API_BASE_URL,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
      });

      if (!token) {
        console.error("fetchUsers: No token available");
        return rejectWithValue("No authentication token available");
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
      });

      if (search) {
        queryParams.append("search", search);
      }

      const url = `${API_BASE_URL}/users?${queryParams}`;
      console.log("fetchUsers: Making request to:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("fetchUsers: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("fetchUsers: API error", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        return rejectWithValue(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("fetchUsers: Success", {
        totalUsers: data.total,
        returnedUsers: data.data?.length || 0,
      });

      return data;
    } catch (error) {
      console.error("fetchUsers: Network or parsing error", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for creating user
export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData: CreateUserData, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to create user");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for updating user
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (
    { id, userData }: { id: string; userData: UpdateUserData },
    { getState, rejectWithValue }
  ) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to update user");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

// Async thunk for deleting user
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Get token from Redux store
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to delete user");
      }

      return { id };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error"
      );
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers(
      state,
      action: PayloadAction<{
        users: UserRow[];
        total: number;
        page: number;
        totalPages: number;
      }>
    ) {
      state.users = action.payload.users;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.totalPages = action.payload.totalPages;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    updateUserInState(state, action: PayloadAction<UserRow>) {
      const idx = state.users.findIndex((u) => u.id === action.payload.id);
      if (idx !== -1) {
        state.users[idx] = action.payload;
      }
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    addUser(state, action: PayloadAction<UserRow>) {
      state.users.unshift(action.payload);
      state.total += 1;
    },
    removeUser(state, action: PayloadAction<string>) {
      state.users = state.users.filter((u) => u.id !== action.payload);
      state.total -= 1;
    },
    clearError(state) {
      state.error = null;
    },
    clearCreateError(state) {
      state.createError = null;
    },
    clearUpdateError(state) {
      state.updateError = null;
    },
    clearDeleteError(state) {
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch users";
      })
      .addCase(createUser.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.creating = false;
        // Add the new user to the beginning of the list
        state.users.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.creating = false;
        state.createError =
          (action.payload as string) || "Failed to create user";
      })
      .addCase(updateUser.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updating = false;
        // Update the user in the list
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) {
          state.users[idx] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          (action.payload as string) || "Failed to update user";
      })
      .addCase(deleteUser.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleting = false;
        // Remove the user from the list
        state.users = state.users.filter((u) => u.id !== action.payload.id);
        state.total -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError =
          (action.payload as string) || "Failed to delete user";
      });
  },
});

export const {
  setUsers,
  setLoading,
  updateUserInState,
  setPage,
  addUser,
  removeUser,
  clearError,
  clearCreateError,
  clearUpdateError,
  clearDeleteError,
} = usersSlice.actions;
export default usersSlice.reducer;
