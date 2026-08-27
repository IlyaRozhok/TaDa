"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  getNavigationDepth,
  getServerNavigationDepth,
  recordNavigation,
  recordPop,
  subscribeToNavigationDepth,
} from "@/app/lib/navigationDepth";

/**
 * How deep into its own history this document currently is. Zero means the
 * current entry is the one it opened on, so `router.back()` would leave the
 * app. See `@/app/lib/navigationDepth` for what the number means and how it is
 * derived; `useGoBack` is the consumer that acts on it.
 */
export function useNavigationDepth(): number {
  return useSyncExternalStore(
    subscribeToNavigationDepth,
    getNavigationDepth,
    getServerNavigationDepth,
  );
}

/**
 * Feeds the navigation-depth store from the browser.
 *
 * Two readings, no Next router internals. A `popstate` listener flags that the
 * next settled navigation is a back/forward, and an effect keyed on the route
 * records `window.history.length` once that navigation has landed. Push grows
 * the length, replace leaves it flat, and the flag separates back/forward from
 * both — which is all the store needs. Anything App Router changes underneath
 * us leaves those two primitives alone.
 *
 * The route key is the pathname plus the *serialised* search string, both
 * primitives, for the same reason `PageViewTracker` uses it: `useSearchParams()`
 * hands back a fresh object on router updates that did not touch the query, and
 * pathname alone would miss a navigation that changed only the query.
 *
 * The depth itself lives at module scope rather than in React state, so it
 * survives every remount and resets only when the document is replaced — which
 * is exactly the boundary that matters (see the module's own doc comment).
 * That is also why this component provides no React context: it renders nothing
 * and is mounted as a sibling of the tree, so consumers subscribe to the module
 * store through `useNavigationDepth()` instead of through a wrapper.
 *
 * ## Why the caller wraps this in its own Suspense boundary
 *
 * `useSearchParams()` bails the nearest Suspense boundary out to client-side
 * rendering. Harmless for a component that renders nothing — but only if the
 * boundary is its own. Left under the root boundary it would take the whole app
 * tree with it, the same 65KB → 11KB collapse of the landing page's static HTML
 * that `PageViewTracker` documents. Kept a separate component from that tracker
 * for the same reason they are separate concerns: analytics and navigation
 * state have no business sharing a lifetime.
 *
 * Renders nothing.
 */
function NavigationDepthProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  useEffect(() => {
    const handlePopState = () => recordPop();

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    recordNavigation(window.history.length);
  }, [pathname, search]);

  return null;
}

export default NavigationDepthProvider;
