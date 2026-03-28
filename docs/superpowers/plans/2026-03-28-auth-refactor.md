# Auth Refactor — Cookie-Only + Unified API Client

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all localStorage token storage from the frontend, delete `base-client.ts`, and rely entirely on httpOnly cookies + Redux `{ user, isAuthenticated }` state.

**Architecture:** The backend already sets httpOnly cookies (`access_token`, `refresh_token`) on every auth response and reads them via the JWT strategy. The frontend duplicated this with localStorage — we remove that layer. The single axios instance in `api.ts` sends cookies automatically via `withCredentials: true`. RTK Query sends them via `credentials: 'include'`.

**Tech Stack:** Next.js 14, Redux Toolkit, RTK Query, Axios, TypeScript

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `frontend/src/app/store/slices/authSlice.ts` | Modify | Remove `accessToken`/`sessionExpiry`; merge `setCredentials`/`setAuth` → `setUser`; remove stale selectors |
| `frontend/src/app/lib/api.ts` | Modify | Delete request interceptor (token injection); remove localStorage calls from 401 handler |
| `frontend/src/app/store/slices/apiSlice.ts` | Modify | Remove `prepareHeaders` (no token in Redux) |
| `frontend/src/app/components/providers/SessionManager.tsx` | Modify | Remove localStorage token read; use `setUser` |
| `frontend/src/app/app/auth/callback/page.tsx` | Modify | Use `setUser`; remove localStorage removals |
| `frontend/src/app/hooks/useAuth.ts` | Modify | Use `setUser`; remove localStorage writes |
| `frontend/src/app/hooks/useOnboarding.ts` | Modify | Remove unused `setAuth` import; remove localStorage token writes |
| `frontend/src/app/utils/simpleRedirect.ts` | Modify | Remove `localStorage.getItem('accessToken')` guard |
| `frontend/src/shared/api/client/base-client.ts` | **Delete** | Replaced by `api.ts` |
| `frontend/src/shared/api/client/index.ts` | Modify | Export thin wrapper using `api.ts` |
| `frontend/src/shared/api/endpoints/auth.ts` | Modify | Use `api.ts` axios instance directly |

---

## Task 1: Refactor `authSlice.ts`

**Files:**
- Modify: `frontend/src/app/store/slices/authSlice.ts`

- [ ] **Step 1: Replace the file contents**

Replace `frontend/src/app/store/slices/authSlice.ts` with:

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

Expected: errors referencing `setAuth`, `setCredentials`, `accessToken`, `sessionExpiry` — these are the callers we will fix in subsequent tasks. No other unexpected errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/store/slices/authSlice.ts && git commit -m "refactor(auth): replace setCredentials/setAuth with setUser, remove token from Redux state"
```

---

## Task 2: Simplify `api.ts` request interceptor

**Files:**
- Modify: `frontend/src/app/lib/api.ts`

- [ ] **Step 1: Remove the request interceptor and clean 401 handler**

Replace the two interceptor blocks (lines 17–55 in the current file) with:

```ts
// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      if (
        !currentPath.includes("/preferences") &&
        !currentPath.includes("/auth") &&
        !currentPath.includes("/onboarding")
      ) {
        import("../store/store").then(({ store }) => {
          store.dispatch(logout());
        });
      }
    }

    return Promise.reject(error);
  },
);
```

The request interceptor block (lines 17–28) is deleted entirely. `withCredentials: true` on the axios instance ensures the httpOnly cookie is sent automatically.

- [ ] **Step 2: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

Expected: same errors as before (unresolved setAuth/setCredentials callers) — no new errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/lib/api.ts && git commit -m "refactor(auth): remove localStorage token injection from axios request interceptor"
```

---

## Task 3: Simplify `apiSlice.ts` — remove token from `prepareHeaders`

**Files:**
- Modify: `frontend/src/app/store/slices/apiSlice.ts`

- [ ] **Step 1: Remove `prepareHeaders`**

Replace the `baseQuery` definition (lines 4–17) with:

```ts
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  credentials: "include",
});
```

Also remove `import type { RootState } from "../store";` from line 2 since it's no longer needed.

- [ ] **Step 2: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/store/slices/apiSlice.ts && git commit -m "refactor(auth): remove token from RTK Query prepareHeaders, rely on cookies"
```

---

## Task 4: Update `SessionManager.tsx`

**Files:**
- Modify: `frontend/src/app/components/providers/SessionManager.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setUser,
  logout,
  setOnboardingCompleted,
} from "../../store/slices/authSlice";
import { fetchShortlist } from "../../store/slices/shortlistSlice";
import { AppDispatch } from "../../store/store";
import api, { preferencesAPI } from "../../lib/api";

// Global promise for session initialization
let sessionManagerPromise: Promise<void> | null = null;
let sessionManagerResolve: (() => void) | null = null;

if (typeof window !== "undefined") {
  sessionManagerPromise = new Promise((resolve) => {
    sessionManagerResolve = resolve;
  });
}

export function waitForSessionManager(): Promise<void> {
  return sessionManagerPromise || Promise.resolve();
}

export default function SessionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await api.get("/auth/me");

        if (response.data && response.data.user) {
          dispatch(setUser({ user: response.data.user }));
          console.log("Session restored for:", response.data.user.email);

          if (response.data.user.role === "tenant" || response.data.user.role === "admin") {
            dispatch(fetchShortlist());

            if (!response.data.user.onboardingCompleted) {
              try {
                const prefsResponse = await preferencesAPI.get();
                if (prefsResponse.data && prefsResponse.data.id) {
                  dispatch(setOnboardingCompleted(true));
                }
              } catch {
                // No preferences — user needs to complete onboarding
              }
            }
          }
        }
      } catch (error: any) {
        console.log("Session check failed:", error.response?.status);
        if (error.response?.status === 401) {
          dispatch(logout());
        }
      } finally {
        setIsInitialized(true);
        sessionManagerResolve?.();
      }
    };

    initSession();
  }, [dispatch]);

  return null;
}
```

- [ ] **Step 2: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/components/providers/SessionManager.tsx && git commit -m "refactor(auth): SessionManager uses setUser and cookie-based session restore"
```

---

## Task 5: Update `auth/callback/page.tsx`

**Files:**
- Modify: `frontend/src/app/app/auth/callback/page.tsx`

- [ ] **Step 1: Replace `setAuth` import and dispatch calls**

Change line 6:
```ts
import { setAuth } from "../../../store/slices/authSlice";
```
to:
```ts
import { setUser } from "../../../store/slices/authSlice";
```

Replace lines 117–124 (the dispatch block):
```ts
dispatch(
  setAuth({
    user: profileResponse.data.user,
    accessToken: "",
  })
);
```
with:
```ts
dispatch(setUser({ user: profileResponse.data.user }));
```

Replace lines 108–112 (localStorage removal on missing profile):
```ts
localStorage.removeItem("accessToken");
localStorage.removeItem("sessionExpiry");
```
with nothing — just `return;` after `setError(...)`.

Replace lines 168–169 (localStorage removal in catch block):
```ts
localStorage.removeItem("accessToken");
localStorage.removeItem("sessionExpiry");
```
with nothing (delete those two lines).

Remove the debug button's localStorage references (lines 240–244):
```ts
localStorage: {
  accessToken: !!localStorage.getItem("accessToken"),
  sessionExpiry: localStorage.getItem("sessionExpiry"),
},
```
Replace with:
```ts
localStorage: "(removed — cookie-based auth)",
```

- [ ] **Step 2: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/app/auth/callback/page.tsx && git commit -m "refactor(auth): OAuth callback uses setUser, removes localStorage token handling"
```

---

## Task 6: Update `useAuth.ts`

**Files:**
- Modify: `frontend/src/app/hooks/useAuth.ts`

- [ ] **Step 1: Replace file contents**

```ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser, logout as logoutAction } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";

interface AuthUserData {
  email: string;
  password: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const dispatch = useDispatch();

  const login = async (data: AuthUserData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.login(data);
      dispatch(setUser({ user: response.data.user }));

      const userRole = response.data.user?.role;
      if (userRole === "tenant") {
        router.push("/app/units");
      } else if (userRole === "operator") {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: AuthUserData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.register(data);
      dispatch(setUser({ user: response.data.user }));

      const userRole = response.data.user?.role;
      if (userRole === "tenant") {
        router.push("/app/units");
      } else if (userRole === "operator") {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithPreferences = async (
    data: AuthUserData & { role: string }
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.register(data);
      dispatch(setUser({ user: response.data.user }));
      router.push("/app/units");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    router.push("/");
  };

  return {
    login,
    register,
    registerWithPreferences,
    logout,
    isLoading,
    error,
    setError,
  };
}
```

- [ ] **Step 2: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/hooks/useAuth.ts && git commit -m "refactor(auth): useAuth removes localStorage token writes, uses setUser"
```

---

## Task 7: Clean `useOnboarding.ts`

**Files:**
- Modify: `frontend/src/app/hooks/useOnboarding.ts`

- [ ] **Step 1: Remove unused `setAuth` import and localStorage token writes**

Change line 4:
```ts
import { setAuth } from "../store/slices/authSlice";
```
Delete this line entirely — `setAuth` is imported but never called.

In `handleComplete` (around line 132–136), remove:
```ts
localStorage.setItem("accessToken", state.registeredToken);
localStorage.setItem(
  "sessionExpiry",
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
);
```
Keep only:
```ts
await redirectAfterLogin(state.registeredUser, router);
```

Apply the same removal in `handlePreferencesComplete` (around line 187–191) — identical block.

- [ ] **Step 2: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/hooks/useOnboarding.ts && git commit -m "refactor(auth): remove unused setAuth import and localStorage token writes from useOnboarding"
```

---

## Task 8: Clean `simpleRedirect.ts`

**Files:**
- Modify: `frontend/src/app/utils/simpleRedirect.ts`

- [ ] **Step 1: Remove localStorage token guard**

In `redirectAfterLogin`, the current code checks for a token before calling `preferencesAPI.get()`:
```ts
const token = localStorage.getItem("accessToken");
if (token) {
  const response = await preferencesAPI.get();
  ...
}
```

Replace with (remove the token check — the cookie is sent automatically):
```ts
try {
  const response = await preferencesAPI.get();
  if (!response.data || !response.data.id) {
    console.log(`🔄 New tenant user, redirecting to onboarding`);
    router.replace("/app/onboarding");
    return;
  }
} catch (error: any) {
  if (error.response?.status === 404) {
    console.log(`🔄 New tenant user (no preferences), redirecting to onboarding`);
    router.replace("/app/onboarding");
    return;
  }
  console.warn("⚠️ Error checking preferences:", error);
}
```

- [ ] **Step 2: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/app/utils/simpleRedirect.ts && git commit -m "refactor(auth): remove localStorage token guard from redirectAfterLogin"
```

---

## Task 9: Migrate `shared/api` off `base-client.ts`

**Files:**
- Modify: `frontend/src/shared/api/client/index.ts`
- Modify: `frontend/src/shared/api/endpoints/auth.ts`
- Delete: `frontend/src/shared/api/client/base-client.ts`

- [ ] **Step 1: Check if anything else imports from shared/api**

```bash
grep -r "from '@/shared/api'" /Users/irozhok/Desktop/Tada/tada-prod/frontend/src --include="*.ts" --include="*.tsx" | grep -v "shared/api/" | grep -v "node_modules"
```

Expected: few or no results (the shared api is mostly self-contained). Note any files found and handle them in Step 2.

- [ ] **Step 2: Rewrite `shared/api/client/index.ts`**

Replace contents with:

```ts
/**
 * API Client exports
 *
 * Re-exports the main axios instance from app/lib/api.
 * BaseApiClient has been removed — use the axios instance directly.
 */

export { default as apiClient } from '@/app/lib/api';
```

- [ ] **Step 3: Rewrite `shared/api/endpoints/auth.ts`**

Replace contents with:

```ts
/**
 * Authentication API endpoints (shared)
 * Uses the main axios instance — cookies handle auth automatically.
 */

import api from '@/app/lib/api';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from '@/shared/types/user';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/users/profile', profileData);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password: newPassword });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email });
  },
} as const;
```

- [ ] **Step 4: Delete `base-client.ts`**

```bash
rm /Users/irozhok/Desktop/Tada/tada-prod/frontend/src/shared/api/client/base-client.ts
```

- [ ] **Step 5: Verify compile**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1 | head -80
```

Expected: zero errors. If there are import errors referencing `BaseApiClient`, grep for them:
```bash
grep -r "BaseApiClient\|base-client" /Users/irozhok/Desktop/Tada/tada-prod/frontend/src --include="*.ts" --include="*.tsx"
```
Fix any remaining imports by changing them to import from `@/app/lib/api`.

- [ ] **Step 6: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add frontend/src/shared/api/client/ frontend/src/shared/api/endpoints/auth.ts && git commit -m "refactor(auth): delete BaseApiClient, migrate shared auth endpoints to main axios instance"
```

---

## Task 10: Sweep remaining `localStorage` accessToken references

**Files:**
- Multiple (identified by grep)

- [ ] **Step 1: Find all remaining references**

```bash
grep -rn "localStorage.*accessToken\|accessToken.*localStorage" /Users/irozhok/Desktop/Tada/tada-prod/frontend/src --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Handle each hit**

For each remaining hit, the fix depends on context:

- **Reading the token to add to a request** → delete the read + header injection (cookie handles it)
- **Writing the token after login/register** → delete the `localStorage.setItem` call
- **Removing the token on logout/error** → keep `localStorage.removeItem("accessToken")` only in the `logout` reducer (already there as a stale-key cleanup) — delete all other removal sites
- **`authSlice.simplified.ts`** → delete this file if it exists as a parallel draft

For each file:
```bash
# Example: check what the file does with the token
grep -n "accessToken" /path/to/file.ts
```
Then edit to remove the localStorage interaction.

- [ ] **Step 3: Verify compile is clean**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 4: Grep for any `accessToken` still being set in localStorage**

```bash
grep -rn "localStorage.setItem.*accessToken\|setItem.*['\"]accessToken" /Users/irozhok/Desktop/Tada/tada-prod/frontend/src
```

Expected: zero results.

- [ ] **Step 5: Commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add -p && git commit -m "refactor(auth): remove all remaining localStorage accessToken reads and writes"
```

---

## Task 11: Final verification

- [ ] **Step 1: TypeScript clean build**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod/frontend && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 2: No localStorage auth keys being written**

```bash
grep -rn "setItem.*['\"]accessToken\|setItem.*['\"]sessionExpiry\|setItem.*['\"]authCredentials" /Users/irozhok/Desktop/Tada/tada-prod/frontend/src
```

Expected: zero results.

- [ ] **Step 3: No localStorage auth keys being read for auth purposes**

```bash
grep -rn "getItem.*['\"]accessToken" /Users/irozhok/Desktop/Tada/tada-prod/frontend/src
```

Expected: zero results.

- [ ] **Step 4: No `setAuth` or `setCredentials` references remaining**

```bash
grep -rn "setAuth\|setCredentials" /Users/irozhok/Desktop/Tada/tada-prod/frontend/src
```

Expected: zero results (only in git history).

- [ ] **Step 5: Verify `base-client.ts` is gone**

```bash
ls /Users/irozhok/Desktop/Tada/tada-prod/frontend/src/shared/api/client/
```

Expected: `index.ts` only.

- [ ] **Step 6: Final commit**

```bash
cd /Users/irozhok/Desktop/Tada/tada-prod && git add -A && git commit -m "refactor(auth): auth refactor complete — cookie-only, no localStorage tokens"
```
