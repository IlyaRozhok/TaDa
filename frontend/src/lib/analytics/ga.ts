/**
 * GA4 runtime.
 *
 * Everything that decides *whether* analytics runs lives here, so call sites
 * never guard: they call `track()` unconditionally and this module drops the
 * event when it must not be sent.
 *
 * Staging must never reach the production GA4 property. `stage.ta-da.co` is a
 * branch deployment of the same Vercel project as production, so a single check
 * is not enough — three independent conditions have to hold at once, and any
 * one of them failing keeps GA4 uninitialised and every event a no-op:
 *
 *   1. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (Vercel Production scope only).
 *   2. `NEXT_PUBLIC_VERCEL_ENV === "production"` (develop deploys are "preview").
 *   3. `window.location.hostname` is one of the production hosts.
 */

import type { AnalyticsEvent } from "./events";

/** Hosts the production GA4 property is allowed to receive traffic from. */
export const PROD_HOSTNAMES: readonly string[] = ["ta-da.co", "www.ta-da.co"];

/** Only tenants move through the tracked funnel; admins and operators do not. */
const TRACKED_ROLE = "tenant";

/** The three inputs the guard chain reads, passed in so it can be tested. */
export interface AnalyticsEnvironment {
  measurementId: string | null | undefined;
  vercelEnv: string | null | undefined;
  hostname: string | null | undefined;
}

type GtagFn = (...args: unknown[]) => void;

interface GtagWindow extends Window {
  dataLayer?: unknown[];
  gtag?: GtagFn;
}

/**
 * The guard chain, as a pure function.
 *
 * All three conditions must hold. Kept separate from the browser globals so it
 * can be unit-tested without a DOM.
 */
export function shouldInitAnalytics(env: AnalyticsEnvironment): boolean {
  const measurementId = env.measurementId?.trim();

  if (!measurementId) {
    return false;
  }

  if (env.vercelEnv !== "production") {
    return false;
  }

  const hostname = env.hostname?.trim().toLowerCase();

  if (!hostname || !PROD_HOSTNAMES.includes(hostname)) {
    return false;
  }

  return true;
}

/** Reads the guard inputs from the environment and the browser. */
export function readAnalyticsEnvironment(): AnalyticsEnvironment {
  return {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
    hostname:
      typeof window === "undefined" ? null : window.location.hostname,
  };
}

/**
 * Whether analytics may run at all here. False on the server, on staging, on
 * previews and in local development.
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return shouldInitAnalytics(readAnalyticsEnvironment());
}

let initialized = false;
let currentRole: string | null = null;

/**
 * The standard gtag stub. `dataLayer.push(arguments)` has to receive the real
 * `arguments` object — gtag.js does not understand a plain array — which is why
 * this is a function expression rather than an arrow.
 */
function ensureGtagStub(win: GtagWindow): void {
  win.dataLayer = win.dataLayer || [];

  if (!win.gtag) {
    win.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer?.push(arguments);
    };
  }
}

/**
 * Sets up the dataLayer and configures the measurement id. Safe to call more
 * than once. The gtag.js script itself is loaded by `AnalyticsProvider`; the
 * stub queues everything sent before it arrives.
 */
export function initAnalytics(): void {
  if (initialized || !isAnalyticsEnabled()) {
    return;
  }

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  if (!measurementId) {
    return;
  }

  const win = window as GtagWindow;
  ensureGtagStub(win);

  win.gtag?.("js", new Date());
  // This is a single-page app: page_view is not what the funnel measures, and
  // the automatic one would fire on the wrong routes anyway.
  win.gtag?.("config", measurementId, { send_page_view: false });

  initialized = true;
}

/** The subset of the signed-in user analytics is allowed to see. */
export interface AnalyticsUser {
  id: string;
  role?: string;
}

/**
 * Binds GA4 to the internal user id and records the role.
 *
 * The id is the `users` table UUID — never an email, phone number or name.
 * The role decides whether funnel events are sent at all; the id is set for
 * every role so sessions stay attributable.
 *
 * Pass `null` on sign-out.
 */
export function setAnalyticsUser(user: AnalyticsUser | null): void {
  currentRole = user?.role ?? null;

  if (!isAnalyticsEnabled()) {
    return;
  }

  initAnalytics();

  const win = window as GtagWindow;
  win.gtag?.("set", { user_id: user?.id ?? null });
}

/**
 * Sends one catalog event.
 *
 * A no-op unless analytics is enabled here, gtag has been set up, and the
 * signed-in user is a tenant. Call sites do not check any of that.
 */
export function track(event: AnalyticsEvent): void {
  if (!isAnalyticsEnabled() || currentRole !== TRACKED_ROLE) {
    return;
  }

  initAnalytics();

  const win = window as GtagWindow;
  win.gtag?.("event", event.name, event.params);
}

/** Test seam: clears the module's state between cases. */
export function resetAnalyticsForTests(): void {
  initialized = false;
  currentRole = null;
}
