/**
 * First-party cookie access for the analytics modules.
 *
 * Extracted because two modules now keep a value in a cookie for the same
 * reason: `consent.ts` stores the banner's answer, `attribution.ts` stores the
 * ad click that brought the visitor in. Both need a cookie rather than
 * localStorage, both write the same attributes, and both have to survive the
 * `document` being absent on the server.
 *
 * Everything written here is first-party, `SameSite=Lax` and readable by
 * script — no third-party cookie is involved anywhere in this folder.
 */

/** Reads one cookie, or null when it is absent or `document` does not exist. */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const encodedName = encodeURIComponent(name);
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${encodedName}=([^;]*)`),
  );

  if (!match) return null;

  try {
    return decodeURIComponent(match[1] ?? "");
  } catch {
    // A value that is not valid percent-encoding is still worth returning raw.
    return match[1] ?? null;
  }
}

/**
 * Writes one first-party cookie with an explicit lifetime.
 *
 * `Secure` is added only over https so the same call works on localhost, where
 * a Secure cookie would be dropped.
 */
export function writeCookie(
  name: string,
  value: string,
  maxAgeDays: number,
): void {
  if (typeof document === "undefined") return;

  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value,
  )}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}
