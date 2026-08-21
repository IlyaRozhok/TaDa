/**
 * Server-side reads of the public API, used by server components for
 * generateMetadata and JSON-LD. Never throws: metadata must degrade to the
 * site defaults when the API is unreachable, not take the page down with it.
 * Responses are ISR-cached for `REVALIDATE_SECONDS` per URL.
 */

const REVALIDATE_SECONDS = 300;

export interface PublicPropertySummary {
  id: string;
  title: string;
  descriptions?: string | null;
  address?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_meters?: number | null;
  photos?: string[];
  property_type?: string | null;
}

export interface PublicBuildingSummary {
  id: string;
  name?: string | null;
  address?: string | null;
  descriptions?: string | null;
  logo?: string | null;
}

async function fetchPublicJson<T>(path: string): Promise<T | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchPublicProperty(
  id: string,
): Promise<PublicPropertySummary | null> {
  // The route treats a malformed id as a DB error; don't even ask.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Promise.resolve(null);
  return fetchPublicJson<PublicPropertySummary>(`/properties/public/${id}`);
}

export function fetchPublicBuilding(
  id: string,
): Promise<PublicBuildingSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Promise.resolve(null);
  return fetchPublicJson<PublicBuildingSummary>(`/buildings/public/${id}`);
}
