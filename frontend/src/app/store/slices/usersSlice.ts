import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  created_at: string;
}

export interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  roles: string[];
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
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
  async (userData: CreateUserData, { getState }) => {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
      throw new Error(errorData.message || "Failed to create user");
    }

    return response.json();
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
    updateUser(state, action: PayloadAction<UserRow>) {
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
        state.error = action.error.message || "Failed to fetch users";
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
        state.createError = action.error.message || "Failed to create user";
      });
  },
});

export const {
  setUsers,
  setLoading,
  updateUser,
  setPage,
  addUser,
  removeUser,
  clearError,
  clearCreateError,
} = usersSlice.actions;
export default usersSlice.reducer;
