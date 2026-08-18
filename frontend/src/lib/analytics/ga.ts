/**
 * GA4 runtime.
 *
 * Everything that decides *whether* analytics runs lives here, so call sites
 * never guard: they call `track()` unconditionally and this module drops the
 * event when it must not be sent.
 *
 * Staging must never reach the production GA4 property. `stage.ta-da.co` is a
 * branch deployment of the same Vercel project as production, so a single check
 * is not enough — four independent conditions have to hold at once, and any
 * one of them failing keeps GA4 uninitialised and every event a no-op:
 *
 *   1. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (Vercel Production scope only).
 *   2. `NEXT_PUBLIC_VERCEL_ENV === "production"` (develop deploys are "preview").
 *   3. `window.location.hostname` is one of the production hosts.
 *   4. The user has granted analytics consent in the cookie banner.
 *
 * The consent condition is opt-in for everyone, with no geo-gating: until the
 * banner is answered with Accept, the stored decision is "unset", the guard
 * fails and gtag.js is never even requested.
 */

import { readAnalyticsConsent, type AnalyticsConsent } from "./consent";
import type { AnalyticsEvent } from "./events";

/** Hosts the production GA4 property is allowed to receive traffic from. */
export const PROD_HOSTNAMES: readonly string[] = ["ta-da.co", "www.ta-da.co"];

/** Only tenants move through the tracked funnel; admins and operators do not. */
const TRACKED_ROLE = "tenant";

/** The four inputs the guard chain reads, passed in so it can be tested. */
export interface AnalyticsEnvironment {
  measurementId: string | null | undefined;
  vercelEnv: string | null | undefined;
  hostname: string | null | undefined;
  consent: AnalyticsConsent;
}

type GtagFn = (...args: unknown[]) => void;

interface GtagWindow extends Window {
  dataLayer?: unknown[];
  gtag?: GtagFn;
}

/**
 * The guard chain, as a pure function.
 *
 * All four conditions must hold. Kept separate from the browser globals so it
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

  // Opt-in: anything other than an explicit grant — including "unset", which is
  // what an unanswered banner reads as — keeps analytics off.
  if (env.consent !== "granted") {
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
    consent: readAnalyticsConsent(),
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
 * Google Consent Mode v2 defaults: everything denied.
 *
 * Pushed before `config`, which is what Consent Mode requires — a default that
 * arrives after the measurement id has already been configured is ignored. The
 * ad_* signals are denied permanently: this property runs no advertising and
 * the banner never asks for it.
 */
function setConsentModeDefaults(win: GtagWindow): void {
  win.gtag?.("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

/**
 * Sets up the dataLayer and configures the measurement id. Safe to call more
 * than once. The gtag.js script itself is loaded by `AnalyticsProvider`; the
 * stub queues everything sent before it arrives.
 *
 * Only reached once consent is granted, so the Consent Mode dance is short:
 * defaults denied, then a single update granting `analytics_storage`.
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

  setConsentModeDefaults(win);

  win.gtag?.("js", new Date());
  // This is a single-page app: page_view is not what the funnel measures, and
  // the automatic one would fire on the wrong routes anyway.
  win.gtag?.("config", measurementId, { send_page_view: false });

  win.gtag?.("consent", "update", { analytics_storage: "granted" });

  initialized = true;
}

/**
 * Re-applies the stored decision to a session that is already running.
 *
 * Accepting is handled by `initAnalytics`. This exists for the other direction:
 * a user who accepted and then rejected in the same session has a live gtag.js
 * that must be told to stop using storage. `track()` is already a no-op by then
 * — the guard chain sees "denied" — but the running tag is not ours to leave in
 * a granted state.
 */
export function syncAnalyticsConsent(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (readAnalyticsConsent() === "granted") {
    initAnalytics();
    return;
  }

  if (!initialized) {
    return;
  }

  const win = window as GtagWindow;
  win.gtag?.("consent", "update", { analytics_storage: "denied" });
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
