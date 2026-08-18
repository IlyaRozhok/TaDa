/**
 * One session refresh at a time, shared by both HTTP clients.
 *
 * The session is two httpOnly cookies: a short-lived `access_token` and a
 * long-lived `refresh_token`. When the access token dies, every request already
 * in flight comes back 401 at once — and those requests are split across two
 * clients, RTK Query and the axios instance in `api.ts`.
 *
 * `POST /auth/refresh` rotates: issuing a new pair immediately invalidates the
 * refresh token that bought it. A second, concurrent refresh would therefore
 * present an already-superseded token and be rejected with "Refresh token reuse
 * or invalidation detected" — signing the user out for real, which is the exact
 * failure this module exists to prevent. So the call is funnelled through one
 * in-flight promise and every other caller awaits that same promise.
 *
 * The request is a plain `fetch` on purpose: it belongs to neither client, so it
 * cannot be caught by their own 401 handling and cannot recurse.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

let inFlight: Promise<boolean> | null = null;

async function requestNewTokens(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      // The refresh token is an httpOnly cookie — without this it is not sent
      // and the endpoint answers 401 to a perfectly good session.
      credentials: "include",
    });
    return response.ok;
  } catch {
    // The network is down, or CORS rejected us. Neither is a session we can
    // recover here, and neither is worth retrying on this path.
    return false;
  }
}

/**
 * Renews the session cookies, or joins the renewal already running.
 *
 * Resolves `true` once the cookies have been replaced, `false` if the refresh
 * token is gone, expired or already rotated — the caller signs the user out on
 * `false`, and only then.
 */
export function refreshSession(): Promise<boolean> {
  if (!inFlight) {
    inFlight = requestNewTokens().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}
