"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { captureAttribution } from "@/lib/analytics/attribution";
import { buildPageViewParams } from "@/lib/analytics/events";
import { trackPageView } from "@/lib/analytics/ga";

/**
 * Sends a GA4 page view on the first load and on every route change, and
 * captures the ad click that brought the visitor in.
 *
 * gtag is configured with `send_page_view: false`, and its automatic view fires
 * on `config` alone anyway — once per full page load, never on a client-side
 * navigation, which is almost every navigation in an App Router app and the
 * reason GA4 reported no views at all. So this effect is the only source of
 * page views.
 *
 * `pathname` and the *serialised* search string are the dependencies, both
 * primitives. `useSearchParams()` hands back a fresh object on router updates
 * where the query has not changed, so depending on it directly would re-run
 * this on renders that are not navigations. Pathname alone is not enough
 * either: it would miss a navigation that changes only the query, which is how
 * a paginated or sorted feed would move. Whatever slips through, the identical
 * `page_location` twice in a row is dropped by `trackPageView` — which is also
 * what covers Strict Mode's double-mounted effect on the first load.
 *
 * The attribution capture sits in the same effect because it needs the same
 * first paint: a visitor arriving on `/?gclid=...` may click straight through
 * to Google sign-in, and after that round trip the parameters are gone.
 *
 * ## Why the caller wraps this in its own Suspense boundary
 *
 * `useSearchParams()` makes Next bail the nearest Suspense boundary out to
 * client-side rendering — the prerendered HTML carries a
 * `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker for it, and the content behind it
 * is rendered by the browser after hydration instead. That is harmless for a
 * component that renders nothing, and it is why the layout must not let this
 * sit directly under the root boundary: measured against a production build,
 * the landing page's static HTML falls from 65KB of markup to an 11KB empty
 * shell when the root boundary is the one that takes the bailout.
 *
 * Renders nothing. Everything downstream is guarded in `ga.ts`, so this stays
 * mounted on staging and locally without sending anything.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  useEffect(() => {
    captureAttribution(search);

    trackPageView(
      buildPageViewParams(
        window.location.origin,
        pathname ?? window.location.pathname,
        search,
        document.title,
      ),
    );
  }, [pathname, search]);

  return null;
}

export default PageViewTracker;
