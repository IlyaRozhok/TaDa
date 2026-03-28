# Auth Refactor Design — Cookie-Only + Unified API Client

**Date:** 2026-03-28
**Scope:** Frontend auth cleanup (Approach B)
**Goal:** Remove localStorage token storage, unify API clients, rely entirely on httpOnly cookies + Redis sessions.

---

## Problems Being Fixed

1. `accessToken` stored in Redux state and localStorage — redundant (httpOnly cookies already handle auth) and an XSS risk
2. `authCredentials` (email/password) stored in localStorage — security risk
3. `sessionExpiry` tracked on the frontend — backend's responsibility
4. Three API clients (`api.ts`, `base-client.ts`, `apiSlice.ts`) with inconsistent 401 handling and each reading tokens from localStorage
5. `SessionManager` restoring token from localStorage on startup

---

## What Is NOT Changing

- Backend auth is correct: httpOnly cookies, Redis sessions, JWT strategy — no backend changes
- `onboardingState`, `preferencesStep`, `preferencesDraft` localStorage keys — untouched
- RTK Query `apiSlice.ts` structure — stays, only `prepareHeaders` simplified
- Cookie configuration (`withCredentials: true`, `credentials: 'include'`) — stays

---

## Section 1: Auth State & Storage

### Redux `authSlice`

**Before:**
```ts
{
  user: User | null,
  isAuthenticated: boolean,
  accessToken: string | null,
  sessionExpiry: number | null
}
```

**After:**
```ts
{
  user: User | null,
  isAuthenticated: boolean
}
```

**Action changes:**
- `setCredentials` and `setAuth` merged into single `setUser({ user: User })` action
- `logout` clears `user` and `isAuthenticated` only — no localStorage calls
- `updateUser`, `setIsOnboarded`, `setOnboardingCompleted` — unchanged

**localStorage keys removed:**
- `accessToken`
- `sessionExpiry`
- `authCredentials`

---

## Section 2: API Client Consolidation

### `api.ts` — single axios instance (retained, simplified)

- `withCredentials: true` stays
- **Request interceptor removed** — no token to inject, cookies sent automatically
- **Response interceptor unified:**
  - On 401: dispatch `logout()` + redirect to `/auth/login`
  - Skip logout on: `/auth`, `/preferences`, `/onboarding` pages
- All imports currently pointing to `base-client.ts` migrate to `api.ts`

### `base-client.ts` — deleted

- `BaseApiClient` class removed entirely
- Any feature-level API files using `BaseApiClient` rewritten to use `api.ts` axios instance directly

### `apiSlice.ts` — simplified

- `prepareHeaders` no longer reads `accessToken` from Redux state
- `credentials: 'include'` stays
- Endpoint definitions unchanged

---

## Section 3: SessionManager & OAuth Callback

### `SessionManager.tsx`

**Before:** Reads `accessToken` from localStorage, passes to `setAuth()`
**After:**
1. Call `GET /auth/me` directly (cookie sent automatically)
2. On success: dispatch `setUser({ user })`
3. On 401: dispatch `logout()`, remove any stale auth localStorage keys

### `auth/callback/page.tsx` (Google OAuth)

- Remove all localStorage token handling
- Call `GET /auth/me`, dispatch `setUser({ user })`
- Backend already sets cookies in the redirect — no change needed

### Token Refresh

- Backend sets new cookies on `POST /auth/refresh`
- Frontend retries original request after refresh — no token juggling

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/app/store/slices/authSlice.ts` | Remove `accessToken`, `sessionExpiry`; merge `setCredentials`/`setAuth` → `setUser` |
| `frontend/src/app/lib/api.ts` | Remove request interceptor; unify 401 handler |
| `frontend/src/app/store/slices/apiSlice.ts` | Remove token from `prepareHeaders` |
| `frontend/src/app/components/providers/SessionManager.tsx` | Remove localStorage read; use `setUser` |
| `frontend/src/app/app/auth/callback/page.tsx` | Remove localStorage token handling |
| `frontend/src/shared/api/client/base-client.ts` | **Delete** |
| Feature files using `BaseApiClient` | Migrate to `api.ts` |

---

## Success Criteria

- No `localStorage.getItem('accessToken')` calls anywhere in frontend code
- No `localStorage.setItem('accessToken', ...)` calls anywhere
- No `authCredentials` in localStorage
- Single 401 handling path
- Login, logout, Google OAuth, token refresh all work correctly
- Redux auth state contains only `user` and `isAuthenticated`
