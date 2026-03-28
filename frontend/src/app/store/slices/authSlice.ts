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

export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;

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
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      const { user } = action.payload;
      const onboarded = user.isOnboarded ?? isProfileComplete(user);
      state.user = { ...user, isOnboarded: onboarded };
      state.isAuthenticated = true;
    },
    logout: (state) => {
      const userId = state.user?.id;
      const userEmail = state.user?.email;

      state.user = null;
      state.isAuthenticated = false;

      // Clear app state and any stale auth keys left from the old localStorage-based flow
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("sessionExpiry");
        localStorage.removeItem("authCredentials");
        localStorage.removeItem("onboardingState");
        localStorage.removeItem("preferencesStep");
        localStorage.removeItem("preferencesDraft");
      }

      authLogger.info("User logged out", "logout", {
        user_id: userId,
        user_email: userEmail,
      });
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (!state.user) return;

      const payload = action.payload;

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
  setUser,
  logout,
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
export const selectIsOnboarded = (state: { auth: AuthState }) =>
  state.auth.user?.isOnboarded ?? false;
export const selectOnboardingCompleted = (state: { auth: AuthState }) =>
  state.auth.user?.onboardingCompleted ?? false;
