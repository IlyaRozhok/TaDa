import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createPostThunk } from "@/shared/lib/redux/asyncThunkHelpers";
import { addLoadingCase, StateWithLoading } from "@/shared/lib/redux/reducerHelpers";
import { createSliceSelector, createLoadingSelector, createErrorSelector } from "@/shared/lib/redux/selectorHelpers";
import type { RootState } from "../store";

// Types
interface TenantProfile {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  age_range?: string;
  phone?: string;
  date_of_birth?: string | Date;
  nationality?: string;
  occupation?: string;
  industry?: string;
  work_style?: string;
  lifestyle?: string;
  pets?: string;
  smoker?: boolean;
  hobbies?: string;
  ideal_living_environment?: string;
  additional_info?: string;
}

interface OperatorProfile {
  id: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  business_address?: string;
  years_experience?: number;
  operating_areas?: string[];
  description?: string;
  website?: string;
  linkedin?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  provider?: string;
  google_id?: string;
  avatar_url?: string;
  email_verified?: boolean;
  full_name?: string;
  roles?: string[];
  isOnboarded?: boolean;
  onboardingCompleted?: boolean;
  tenantProfile?: TenantProfile;
  operatorProfile?: OperatorProfile;
}

interface AuthState extends StateWithLoading {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  isOnboarded: boolean;
}

// Initial state
const initialState: AuthState = {
  loading: false,
  error: null,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  isOnboarded: false,
};

// API endpoints
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Async thunks
export const loginUser = createPostThunk<
  { user: User; accessToken: string; refreshToken: string },
  { email: string; password: string }
>("auth/login", `${API_BASE}/auth/login`);

export const registerUser = createPostThunk<
  { user: User; accessToken: string; refreshToken: string },
  { email: string; password: string; role: string }
>("auth/register", `${API_BASE}/auth/register`);

export const refreshToken = createPostThunk<
  { accessToken: string; refreshToken: string },
  { refreshToken: string }
>("auth/refresh", `${API_BASE}/auth/refresh`);

// Helper functions
const isProfileComplete = (user: User | null): boolean => {
  if (!user) return false;

  const hasBasicInfo = !!(user.full_name || (user.tenantProfile?.first_name && user.tenantProfile?.last_name));

  if (user.role === "tenant" && user.tenantProfile) {
    const profile = user.tenantProfile;
    return !!(
      hasBasicInfo &&
      profile.phone &&
      profile.date_of_birth &&
      profile.nationality &&
      profile.occupation
    );
  }

  if (user.role === "operator" && user.operatorProfile) {
    const profile = user.operatorProfile;
    return !!(
      hasBasicInfo &&
      profile.phone &&
      profile.company_name &&
      profile.business_address
    );
  }

  return hasBasicInfo;
};

const calculateTokenExpiry = (expiresIn: number = 3600): number => {
  return Date.now() + expiresIn * 1000;
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
      state.isOnboarded = false;
      state.error = null;

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiry");
      }
    },

    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isOnboarded = isProfileComplete(action.payload);
    },

    setIsOnboarded: (state, action: PayloadAction<boolean>) => {
      state.isOnboarded = action.payload;
    },

    clearAuthError: (state) => {
      state.error = null;
    },

    // Restore auth state from localStorage
    restoreAuthState: (state, action: PayloadAction<{
      user: User;
      accessToken: string;
      refreshToken: string;
      tokenExpiry: number;
    }>) => {
      const { user, accessToken, refreshToken, tokenExpiry } = action.payload;
      
      // Check if token is still valid
      if (Date.now() < tokenExpiry) {
        state.isAuthenticated = true;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.tokenExpiry = tokenExpiry;
        state.isOnboarded = isProfileComplete(user);
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    addLoadingCase(builder, loginUser);
    builder.addCase(loginUser.fulfilled, (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      
      state.isAuthenticated = true;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.tokenExpiry = calculateTokenExpiry();
      state.isOnboarded = isProfileComplete(user);

      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("tokenExpiry", state.tokenExpiry!.toString());
      }
    });

    // Register
    addLoadingCase(builder, registerUser);
    builder.addCase(registerUser.fulfilled, (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      
      state.isAuthenticated = true;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.tokenExpiry = calculateTokenExpiry();
      state.isOnboarded = isProfileComplete(user);

      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("tokenExpiry", state.tokenExpiry!.toString());
      }
    });

    // Refresh token
    addLoadingCase(builder, refreshToken);
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      const { accessToken, refreshToken: newRefreshToken } = action.payload;
      
      state.accessToken = accessToken;
      state.refreshToken = newRefreshToken;
      state.tokenExpiry = calculateTokenExpiry();

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("tokenExpiry", state.tokenExpiry!.toString());
      }
    });
  },
});

// Actions
export const { logout, updateUser, setIsOnboarded, clearAuthError, restoreAuthState } = authSlice.actions;

// Base selector
const selectAuthState = createSliceSelector<AuthState>("auth");

// Basic selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectIsOnboarded = (state: RootState): boolean => state.auth.user?.isOnboarded ?? false;
export const selectAuthLoading = createLoadingSelector(selectAuthState);
export const selectAuthError = createErrorSelector(selectAuthState);

// Computed selectors
export const selectUserRole = (state: RootState) => state.auth.user?.role;
export const selectIsTenant = (state: RootState) => state.auth.user?.role === "tenant";
export const selectIsOperator = (state: RootState) => state.auth.user?.role === "operator";
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === "admin";

export const selectTenantProfile = (state: RootState) => state.auth.user?.tenantProfile;
export const selectOperatorProfile = (state: RootState) => state.auth.user?.operatorProfile;

export const selectIsProfileComplete = (state: RootState) => {
  return isProfileComplete(state.auth.user);
};

export const selectTokenExpiry = (state: RootState) => state.auth.sessionExpiry;
export const selectIsTokenExpired = (state: RootState) => {
  const expiry = state.auth.sessionExpiry;
  return expiry ? Date.now() >= expiry : true;
};

export default authSlice.reducer;