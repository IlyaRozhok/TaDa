import type { MetadataRoute } from "next";
import { isIndexableSite } from "@/app/lib/siteEnv";

// Mirrors the robots metadata rule in layout.tsx: only the production
// deployment (ta-da.co) is crawlable; staging and previews are fully blocked.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexableSite) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/app/admin/",
        "/app/profile/",
        "/app/onboarding/",
        // Private-by-nature pages. /cv/ is the tenant CV share link — a
        // page of personal data reachable by capability URL; it must never
        // be crawlable even on the production site.
        "/cv/",
        "/app/tenant-cv/",
        "/app/preferences/",
        "/app/shortlist/",
        "/app/auth/",
      ],
    },
    sitemap: "https://ta-da.co/sitemap.xml",
  };
}
