import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { authLogger } from "../../services/authLogger";

export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  // OAuth fields
  provider?: string;
  google_id?: string;
  email_verified?: boolean;
  // Personal profile — stored directly in users table
  first_name?: string;
  last_name?: string;
  full_name?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  avatar_url?: string;
  // Onboarding flags
  isOnboarded?: boolean;
  onboardingCompleted?: boolean;
  // Nested profiles (onboarding-specific / backward compat)
  tenantProfile?: {
    id: string;
    userId?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    address?: string;
    phone?: string;
    date_of_birth?: string | Date;
    nationality?: string;
    occupation?: string;
    age_range?: string;
    industry?: string;
    work_style?: string;
    lifestyle?: string[];
    ideal_living_environment?: string;
    additional_info?: string;
    shortlisted_properties?: string[];
  };
  operatorProfile?: {
    id: string;
    full_name?: string;
    phone?: string;
    company_name?: string;
    business_address?: string;
    years_experience?: number;
    operating_areas?: string[];
    business_description?: string;
  };
}

// Utility function to check if user profile is complete
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;

  // All roles: personal fields now live directly on the user object
  const requiredFields = [
    "first_name",
    "last_name",
    "address",
    "phone",
    "date_of_birth",
    "nationality",
  ] as const;

  for (const field of requiredFields) {
    const value = user[field];
    if (!value || String(value).trim() === "") return false;
  }

  return true;
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
      }>,
    ) => {
      const { user, accessToken } = action.payload;

      // Compute isOnboarded based on profile completeness
      const onboarded = user.isOnboarded ?? isProfileComplete(user);

      console.log("🔍 authSlice.setCredentials called with:", {
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        user_full_name: user.full_name,
        has_tenant_profile: !!user.tenantProfile,
        has_operator_profile: !!user.operatorProfile,
        isOnboarded: onboarded,
      });

      state.user = { ...user, isOnboarded: onboarded };
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

      // Clear localStorage (including onboarding and preferences draft so next login starts fresh)
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("sessionExpiry");
        localStorage.removeItem("onboardingState");
        localStorage.removeItem("preferencesStep");
        localStorage.removeItem("preferencesDraft");
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
      }>,
    ) => {
      const { user, accessToken } = action.payload;

      // Compute isOnboarded based on profile completeness
      const onboarded = user.isOnboarded ?? isProfileComplete(user);

      state.user = { ...user, isOnboarded: onboarded };
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
      if (!state.user) return;

      const payload = action.payload;

      // Properly merge nested profiles - API always returns the full objects
      const updatedUser: User = {
        ...state.user,
        ...payload,
        tenantProfile: payload.tenantProfile
          ? { ...state.user.tenantProfile, ...payload.tenantProfile }
          : state.user.tenantProfile,
        operatorProfile: payload.operatorProfile
          ? { ...state.user.operatorProfile, ...payload.operatorProfile }
          : state.user.operatorProfile,
      };

      const onboarded = payload.isOnboarded ?? isProfileComplete(updatedUser);
      state.user = { ...updatedUser, isOnboarded: onboarded };
    },
    setIsOnboarded: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.isOnboarded = action.payload;
      }
    },
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.onboardingCompleted = action.payload;
      }
    },
  },
});

export const {
  setCredentials,
  logout,
  setAuth,
  updateUser,
  setIsOnboarded,
  setOnboardingCompleted,
} = authSlice.actions;
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
export const selectIsOnboarded = (state: { auth: AuthState }) =>
  state.auth.user?.isOnboarded ?? false;
export const selectOnboardingCompleted = (state: { auth: AuthState }) =>
  state.auth.user?.onboardingCompleted ?? false;
