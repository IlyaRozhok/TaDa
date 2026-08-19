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
 *
 * Consent is deliberately *not* one of them. Google Consent Mode v2 wants the
 * tag present from the first pageview with every signal denied, sending
 * cookieless pings it can model conversions from; withholding the tag entirely
 * until someone clicks Accept throws that modelling away. So gtag.js loads for
 * everyone on production, `consent default` denies all four signals before
 * anything else reaches the dataLayer, and the banner's answer arrives later as
 * a `consent update`. Nothing is stored on the device until it does.
 */

import { readStoredAttribution } from "./attribution";
import { readAnalyticsConsent, type AnalyticsConsent } from "./consent";
import type { AnalyticsEvent, PageViewParams } from "./events";

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
 * can be unit-tested without a DOM. Consent is not consulted here — it governs
 * what the tag may *store*, not whether the tag exists.
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
 * `page_location` of the last page view sent, for de-duplication.
 *
 * Module state rather than a ref in the tracker component: it has to outlive
 * the component, because React 19 Strict Mode mounts an effect, tears it down
 * and mounts it again on the same first load. A ref would survive that one, but
 * not a remount of the tracker itself, and either would send the load twice.
 *
 * Only *consecutive* repeats are dropped, so leaving a page and coming back to
 * it is still a second view.
 */
let lastPageLocation: string | null = null;

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

/** The four Consent Mode v2 signals, all denied. The pre-choice state. */
const DENIED_SIGNALS = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

/** The same four, all granted. What "Accept all" means. */
const GRANTED_SIGNALS = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
} as const;

/**
 * How long gtag.js holds a ping back waiting for the banner's answer, in ms.
 *
 * Without it the tag fires its first cookieless ping immediately and a user who
 * clicks Accept a moment later is measured as if they had refused. 500ms is
 * Google's suggested value: long enough for a click on a banner that is already
 * on screen, short enough not to lose the pageview.
 */
const CONSENT_WAIT_FOR_UPDATE_MS = 500;

/**
 * Google Consent Mode v2 defaults: everything denied.
 *
 * Must be pushed before `config` — a default arriving after the measurement id
 * has been configured is ignored, and the tag would have already behaved as if
 * consent were granted.
 */
function setConsentModeDefaults(win: GtagWindow): void {
  win.gtag?.("consent", "default", {
    ...DENIED_SIGNALS,
    wait_for_update: CONSENT_WAIT_FOR_UPDATE_MS,
  });
}

/**
 * Pushes the banner's answer to gtag as a Consent Mode update.
 *
 * Binary by design: the banner offers one non-essential category, so Accept
 * grants all four signals and Reject denies all four. "unset" sends nothing —
 * the default already denies everything, and staying silent is what lets
 * `wait_for_update` do its job.
 */
function updateConsentSignals(consent: AnalyticsConsent): void {
  if (typeof window === "undefined" || consent === "unset") {
    return;
  }

  const win = window as GtagWindow;

  win.gtag?.(
    "consent",
    "update",
    consent === "granted" ? { ...GRANTED_SIGNALS } : { ...DENIED_SIGNALS },
  );
}

/**
 * Sets up the dataLayer and configures the measurement id. Safe to call more
 * than once. The gtag.js script itself is loaded by `AnalyticsProvider`; the
 * stub queues everything sent before it arrives.
 *
 * Runs for every production visitor, whatever they have or have not answered.
 * The order is the one Consent Mode v2 requires: default (all denied) → js →
 * config → replay of the stored decision, if there is one.
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
  // Exactly one `config`, for exactly one measurement id, guarded by
  // `initialized`. That is what keeps the GA4 client id (`_ga`) continuous:
  // configuring twice would restart measurement and could hand the same visitor
  // a second client id across the sign-in boundary, splitting one user into two.
  //
  // `send_page_view: false` because the automatic view fires on `config` only —
  // once per full page load, never on a client-side route change, and before
  // this app's route has settled. `trackPageView` sends every view instead.
  win.gtag?.("config", measurementId, { send_page_view: false });

  initialized = true;

  // A returning visitor already answered: replay it now so the tag does not sit
  // out its `wait_for_update` window waiting for a banner that will not appear.
  updateConsentSignals(readAnalyticsConsent());
}

/**
 * Brings the running tag in line with the stored decision.
 *
 * Called when the banner is answered and when another tab answers it. On a
 * session that has not initialised yet this initialises, which replays the
 * decision as part of the bootstrap; otherwise it sends the update on its own.
 */
export function syncAnalyticsConsent(): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  if (!initialized) {
    initAnalytics();
    return;
  }

  updateConsentSignals(readAnalyticsConsent());
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

/**
 * Sends one page view.
 *
 * Separate from `track()` on purpose: it shares the environment guards — server,
 * staging, previews and local development send nothing — but skips the role
 * gate, because the visits Google Ads pays for are anonymous by definition. It
 * also runs whatever the banner has been answered: under Consent Mode v2 a
 * denied visitor still produces a cookieless ping, which is what Google models
 * conversions from, and withholding the view would throw that away.
 *
 * The same `page_location` twice in a row is dropped. `gtag config` runs with
 * `send_page_view: false`, so this is the only source of page views and there
 * is nothing to collide with — the duplicates worth guarding against are the
 * ones React produces, not gtag.
 */
export function trackPageView(params: PageViewParams): void {
  if (!isAnalyticsEnabled() || params.page_location === lastPageLocation) {
    return;
  }

  initAnalytics();

  lastPageLocation = params.page_location;

  const win = window as GtagWindow;
  win.gtag?.("event", "page_view", params);
}

/**
 * Publishes the stored ad click as GA4 user properties.
 *
 * User properties rather than event parameters: they are user-scoped, so one
 * call attributes the `sign_up` conversion that follows it *and* every later
 * event in the session, and the frozen `{ method }` parameter set of `sign_up`
 * stays as it is. Adding the six values to that event instead would attribute
 * the conversion and nothing after it.
 *
 * Must be called before the event it should attribute — a user property set
 * afterwards does not attach retroactively.
 *
 * The values are the campaign strings and the opaque click id, never PII. They
 * have to be registered as user-scoped custom dimensions in the GA4 admin
 * before they show up in reports.
 */
export function setAttributionUserProperties(): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  const attribution = readStoredAttribution();

  if (!attribution) {
    return;
  }

  initAnalytics();

  const win = window as GtagWindow;
  win.gtag?.("set", "user_properties", { ...attribution });
}

/** Test seam: clears the module's state between cases. */
export function resetAnalyticsForTests(): void {
  initialized = false;
  currentRole = null;
  lastPageLocation = null;
}
