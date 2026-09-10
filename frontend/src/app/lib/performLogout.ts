import { authAPI } from "./api";
import { logout } from "@/store/slices/authSlice";

/**
 * The one logout path, shared by every Sign Out control.
 *
 * The mobile menu used to dispatch the Redux logout and SPA-navigate home —
 * without calling POST /auth/logout the httpOnly cookies stayed valid, so
 * the next visit silently restored the session (a shared-phone hazard), and
 * the SPA navigation kept the whole RTK Query cache (CV, bookings,
 * shortlist) alive in memory.
 *
 * Order matters: revoke the server session first (best-effort — a dead API
 * must not trap the user in a logged-in UI), then clear client state, then
 * hard-navigate so the app remounts with nothing cached.
 */
export async function performLogout(
  dispatch: (action: ReturnType<typeof logout>) => void,
): Promise<void> {
  try {
    await authAPI.logout();
  } catch {
    // Proceed anyway: clearing the client and leaving beats staying
    // signed in because the API was unreachable.
  }

  try {
    dispatch(logout());
    localStorage.clear();
  } catch {
    // Storage can be unavailable (private mode); the redirect still logs
    // the UI out.
  }

  window.location.href = "/";
}
