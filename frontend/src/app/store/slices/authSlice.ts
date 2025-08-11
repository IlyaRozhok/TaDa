import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { authLogger } from "../../services/authLogger";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Computed properties from getter methods
  full_name?: string;
  roles?: string[];
  // Profile data that might be included
  tenantProfile?: {
    id: string;
    full_name: string;
    age_range?: string;
    phone?: string;
    occupation?: string;
    industry?: string;
    work_style?: string;
    lifestyle?: string;
    pets?: string;
    smoker?: boolean;
    hobbies?: string;
    ideal_living_environment?: string;
    additional_info?: string;
  };
  operatorProfile?: {
    id: string;
    full_name: string;
    company_name?: string;
    phone?: string;
    business_address?: string;
    years_experience?: number;
    operating_areas?: string[];
    business_description?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  sessionExpiry: number | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  sessionExpiry: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
      }>
    ) => {
      const { user, accessToken } = action.payload;

      console.log("🔍 authSlice.setCredentials called with:", {
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        user_roles: user.roles,
        user_full_name: user.full_name,
        has_tenant_profile: !!user.tenantProfile,
        has_operator_profile: !!user.operatorProfile,
      });

      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;

      // Set session expiry to 7 days from now
      state.sessionExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // Store token and expiry in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("sessionExpiry", state.sessionExpiry.toString());
      }
    },
    logout: (state) => {
      const userId = state.user?.id;
      const userEmail = state.user?.email;

      console.log("🚪 LOGOUT ACTION CALLED", {
        userId,
        userEmail,
        callStack: new Error().stack,
      });

      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.sessionExpiry = null;

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("sessionExpiry");
      }

      // Log the logout event
      authLogger.info("User logged out", "logout", {
        user_id: userId,
        user_email: userEmail,
      });
    },
    setAuth: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
      }>
    ) => {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;

      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
        const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem("sessionExpiry", expiry.toString());
        state.sessionExpiry = expiry;
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, logout, setAuth, updateUser } =
  authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectSessionExpiry = (state: { auth: AuthState }) =>
  state.auth.sessionExpiry;
