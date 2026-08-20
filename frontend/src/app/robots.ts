import type { MetadataRoute } from "next";

// Mirrors the robots metadata rule in layout.tsx: only the production
// deployment (ta-da.co) is crawlable; staging and previews are fully blocked.
const isIndexable = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app/admin/", "/app/profile/", "/app/onboarding/"],
    },
    sitemap: "https://ta-da.co/sitemap.xml",
  };
}
