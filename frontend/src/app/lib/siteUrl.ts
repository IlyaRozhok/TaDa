/**
 * The canonical public origin — one constant, used everywhere an absolute URL
 * is emitted (sitemap, robots, metadataBase, JSON-LD).
 *
 * It is the **www** host on purpose: production serves at www.ta-da.co and the
 * apex ta-da.co 301-redirects to it. Emitting apex URLs in the sitemap and in
 * canonical tags pointed crawlers at the redirecting host, which is exactly
 * the inconsistency Search Console flagged.
 */
export const SITE_URL = "https://www.ta-da.co";
