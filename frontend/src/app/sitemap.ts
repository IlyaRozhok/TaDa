import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/siteUrl";

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

// Regenerate at most once an hour — the sitemap is fetched by crawlers, not
// users, so freshness within an hour is plenty and it keeps the public API
// out of the hot path.
export const revalidate = 3600;

type PublicPropertiesPage = {
  data: Array<{ id: string; created_at?: string }>;
  totalPages: number;
};

async function fetchPublicPropertyEntries(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];

  const entries: MetadataRoute.Sitemap = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `${apiUrl}/properties/public/all?page=${page}&limit=${PAGE_SIZE}`,
        { next: { revalidate } },
      );
      if (!res.ok) break;

      const body = (await res.json()) as PublicPropertiesPage;
      for (const property of body.data ?? []) {
        entries.push({
          url: `${SITE_URL}/app/properties/${property.id}`,
          lastModified: property.created_at
            ? new Date(property.created_at)
            : undefined,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }

      if (page >= (body.totalPages ?? 1)) break;
    }
  } catch {
    // The sitemap must never 500 because the API is down —
    // fall back to the static pages alone.
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/app/units`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const propertyEntries = await fetchPublicPropertyEntries();
  return [...staticEntries, ...propertyEntries];
}
