"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useNavigationDepth } from "@/app/components/providers/NavigationDepthProvider";
import { goBackOrFallback } from "@/app/lib/navigationDepth";

/**
 * A back affordance that respects where the visitor actually came from.
 *
 * If this document has pushed at least one entry of its own, the button is a
 * real back: the visitor returns to the property they were reading, the search
 * they had filtered, the scroll position the router restores for them. If it
 * has not — a deep link, a shared URL opened in a new tab, the reload that ends
 * the Google OAuth round trip — `router.back()` would either do nothing or eject
 * them from the site, so the hook navigates to `fallbackHref` instead.
 *
 * The fallback uses `replace`, not `push`. The visitor asked to go back; adding
 * an entry would leave them pressing the browser's own back button through a
 * screen they just dismissed.
 *
 * There is deliberately no timer chasing `router.back()` to check whether it
 * "worked". Depth already answers that question before the call, and a timeout
 * racing an in-flight navigation is how you get a back press that lands on the
 * previous page and then jumps to the fallback a moment later.
 *
 * Returns a stable callback; safe to pass straight to `onClick`.
 */
export function useGoBack(fallbackHref: string): () => void {
  const router = useRouter();
  const depth = useNavigationDepth();

  return useCallback(() => {
    goBackOrFallback(router, depth, fallbackHref);
  }, [router, depth, fallbackHref]);
}
