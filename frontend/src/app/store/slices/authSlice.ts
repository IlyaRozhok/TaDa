import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { authLogger } from "../../services/authLogger";

export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Google OAuth fields
  provider?: string;
  google_id?: string;
  avatar_url?: string;
  email_verified?: boolean;
  // Computed properties from getter methods
  full_name?: string;
  roles?: string[];
  // Onboarding flags
  isOnboarded?: boolean;
  onboardingCompleted?: boolean;
  // Profile data that might be included
  tenantProfile?: {
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

// Utility function to check if user profile is complete
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;

  // For tenant role, check tenantProfile
  if (user.role === "tenant") {
    const profile = user.tenantProfile;
    if (!profile) return false;

    // Required fields for tenant profile
    const requiredFields = [
      "first_name",
      "last_name",
      "address",
      "phone",
      "date_of_birth",
      "nationality",
    ] as const;

    for (const field of requiredFields) {
      const value = profile[field];
      if (!value || String(value).trim() === "") {
        return false;
      }
    }

    return true;
  }

  // For operator role, check operatorProfile
  if (user.role === "operator") {
    const profile = user.operatorProfile;
    if (!profile) return false;

    // Required fields for operator profile
    const requiredFields = ["full_name", "phone", "business_address"] as const;

    for (const field of requiredFields) {
      const value = profile[field];
      if (!value || String(value).trim() === "") {
        return false;
      }
    }

    return true;
  }

  // For admin or other roles, consider onboarded by default
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
        user_roles: user.roles,
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
      const currentTenant = state.user.tenantProfile;
      const currentOperator = state.user.operatorProfile;

      const tenantProfileFields: Array<keyof NonNullable<User["tenantProfile"]>> = [
        "first_name",
        "last_name",
        "full_name",
        "address",
        "phone",
        "date_of_birth",
        "nationality",
        "occupation",
      ];

      const operatorProfileFields: Array<keyof NonNullable<User["operatorProfile"]>> = [
        "full_name",
        "phone",
        "business_address",
      ];

      const nextTenant =
        payload.tenantProfile || payload.operatorProfile
          ? {
              id: currentTenant?.id || payload.tenantProfile?.id || "",
              full_name: currentTenant?.full_name || payload.tenantProfile?.full_name || "",
              ...currentTenant,
              ...(payload.tenantProfile ?? {}),
            } as User["tenantProfile"]
          : currentTenant;

      tenantProfileFields.forEach((key) => {
        if (key in payload) {
          // @ts-expect-error indexed assignment
          nextTenant[key] = payload[key as keyof User] as any;
        }
      });

      const nextOperator =
        payload.operatorProfile || payload.tenantProfile
          ? {
              id: currentOperator?.id || payload.operatorProfile?.id || "",
              full_name: currentOperator?.full_name || payload.operatorProfile?.full_name || "",
              ...currentOperator,
              ...(payload.operatorProfile ?? {}),
            } as User["operatorProfile"]
          : currentOperator;

      operatorProfileFields.forEach((key) => {
        if (key in payload) {
          // @ts-expect-error indexed assignment
          nextOperator[key] = payload[key as keyof User] as any;
        }
      });

      const updatedUser: User = {
        ...state.user,
        ...payload,
        // Update avatar_url if provided
        avatar_url:
          payload.avatar_url !== undefined
            ? payload.avatar_url
            : state.user.avatar_url,
        tenantProfile: nextTenant as User["tenantProfile"],
        operatorProfile: nextOperator as User["operatorProfile"],
      };

      // Recompute isOnboarded after profile update
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
