/**
 * In-app history depth: how many entries **this document** has pushed onto the
 * browser session history since it loaded.
 *
 * The number answers one question — is `router.back()` safe? A depth above zero
 * means there is an entry of ours behind the current one, so going back lands
 * somewhere inside the app. A depth of zero means the current entry is the one
 * the document opened on: a deep link, a fresh tab, or the reload that ends the
 * Google OAuth round trip. Calling `back()` there either does nothing or throws
 * the visitor out to whatever site they came from, so callers must fall back to
 * an explicit href instead.
 *
 * State is module-scoped on purpose. A module lives exactly as long as the
 * document, so every one of the three "started here" cases above resets the
 * depth to zero for free, without any storage to invalidate.
 *
 * Everything here is framework-agnostic and free of React and Next imports —
 * `NavigationDepthProvider` supplies the browser readings, and this module owns
 * the arithmetic so it can be unit tested without a DOM.
 */

export type NavigationDepthState = {
  /** Entries this document has pushed. Never negative. */
  depth: number;
  /** `window.history.length` as of the last recorded navigation. */
  historyLength: number;
  /** Set by a `popstate` event, consumed by the navigation that follows it. */
  wasPop: boolean;
  /**
   * False until the first navigation is recorded. The first record only takes
   * a baseline reading of `history.length`; without this flag it would look
   * like a push (any length > the initial 0) and count the landing page itself.
   */
  initialized: boolean;
};

export const INITIAL_NAVIGATION_DEPTH_STATE: NavigationDepthState = {
  depth: 0,
  historyLength: 0,
  wasPop: false,
  initialized: false,
};

/**
 * Flags that the navigation about to happen is a back/forward, not a push.
 *
 * Caveat: `popstate` does not say which direction. A forward press is counted
 * as a back, which undercounts the depth. That errs toward the fallback href —
 * the safe side — so it is not worth Next-internal plumbing to fix.
 */
export function reducePop(state: NavigationDepthState): NavigationDepthState {
  return { ...state, wasPop: true };
}

/**
 * Records a settled navigation, given `window.history.length` at that moment.
 *
 * The discriminator is deliberately built out of two browser primitives rather
 * than Next router internals:
 *
 * - a `popstate` came first  → back/forward, one entry of ours is behind us
 *   again, so the depth drops;
 * - otherwise `history.length` grew → `pushState`, the depth rises;
 * - otherwise → `replaceState`, which swaps the current entry in place and
 *   leaves the length flat, so the depth is unchanged.
 */
export function reduceNavigation(
  state: NavigationDepthState,
  historyLength: number,
): NavigationDepthState {
  if (!state.initialized) {
    return { depth: 0, historyLength, wasPop: false, initialized: true };
  }

  if (state.wasPop) {
    return {
      ...state,
      depth: Math.max(0, state.depth - 1),
      historyLength,
      wasPop: false,
    };
  }

  if (historyLength > state.historyLength) {
    return { ...state, depth: state.depth + 1, historyLength, wasPop: false };
  }

  return { ...state, historyLength, wasPop: false };
}

let state: NavigationDepthState = INITIAL_NAVIGATION_DEPTH_STATE;

const listeners = new Set<() => void>();

export function subscribeToNavigationDepth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * `useSyncExternalStore` snapshot. Returns a number, so React's own bail-out
 * covers the notifications that do not actually move the depth.
 */
export function getNavigationDepth(): number {
  return state.depth;
}

/**
 * Server snapshot. There is no session history while rendering, and a document
 * always starts at zero anyway, so hydration matches.
 */
export function getServerNavigationDepth(): number {
  return 0;
}

export function recordPop(): void {
  state = reducePop(state);
}

export function recordNavigation(historyLength: number): void {
  const next = reduceNavigation(state, historyLength);
  const depthChanged = next.depth !== state.depth;
  state = next;
  if (depthChanged) {
    for (const listener of listeners) {
      listener();
    }
  }
}

/** Test seam. The browser resets this by unloading the document. */
export function resetNavigationDepth(): void {
  state = INITIAL_NAVIGATION_DEPTH_STATE;
}

/** The slice of the Next router this module needs. */
export type BackNavigationRouter = {
  back: () => void;
  replace: (href: string) => void;
};

/**
 * The decision behind `useGoBack`, kept here so it can be tested without React.
 *
 * `replace`, not `push`: the visitor asked to leave this screen, so the
 * fallback must not add another entry they would have to press back through.
 */
export function goBackOrFallback(
  router: BackNavigationRouter,
  depth: number,
  fallbackHref: string,
): void {
  if (depth > 0) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}
