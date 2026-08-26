/**
 * PostHog Session Replay runtime.
 *
 * Replay only. PostHog receives session recordings and nothing else — GA4 owns
 * page views, funnel events and conversions, and sending them here as well
 * would buy a second source of truth that disagrees with the first. Autocapture,
 * page views, page leaves, heatmaps, dead clicks, surveys, web experiments and
 * exception capture are all switched off in `buildReplayInitConfig`.
 *
 * The guard chain is the three conditions `ga.ts` uses plus two more. Both extra
 * gates are deliberate. Do not "align" this module with `ga.ts` later:
 *
 *   1. `NEXT_PUBLIC_POSTHOG_KEY` is set (Vercel Production scope only).
 *   2. `NEXT_PUBLIC_VERCEL_ENV === "production"` (develop deploys are "preview").
 *   3. `window.location.hostname` is one of the production hosts.
 *   4. Consent is "granted" — not merely "not rejected".
 *   5. The signed-in user is a tenant.
 *
 * Why (4), which GA4 does not have. GA4 loads before the banner is answered on
 * purpose: Consent Mode v2 gives it a cookieless mode, so a visitor who has
 * refused still produces a modelled ping and nothing is written to their device.
 * Session replay has no such mode. A recording *is* the page the user is looking
 * at, tied to a session id posthog must store on the device to stitch the
 * snapshots together; there is no anonymous, storage-free version of it. Under
 * PECR/GDPR that makes it strict opt-in, so "unset" and "rejected" both mean:
 * do not initialise, do not record. This is also why posthog-js is behind a
 * dynamic import — with no consent the chunk is never even fetched.
 *
 * Why (5). A replay of an admin or operator session is a replay of the back
 * office: other people's tenancies, their contact details, their documents —
 * data those third parties never consented to have recorded, and that no
 * tenant-facing product question needs. The gate reuses `ga.ts`'s `TRACKED_ROLE`
 * rather than re-declaring "tenant", so the two cannot drift apart. Consequence
 * worth knowing before someone "fixes" it: signed-out visitors are not recorded
 * either, because they have no role. Recording the pre-signup funnel would mean
 * widening this gate to admit "no user at all", which is a product decision
 * about anonymous recording, not a tidy-up.
 *
 * CSP: this app has none today — no middleware, no `headers()` in
 * `next.config.ts`. Whoever adds one must allow `*.i.posthog.com` in
 * `script-src`, `connect-src` and `worker-src`: posthog-js fetches the rrweb
 * recorder bundle from the ingest host at runtime and ships snapshots back to it
 * from a worker.
 */

import type { PostHog, PostHogConfig } from "posthog-js";

import { readAnalyticsConsent, type AnalyticsConsent } from "./consent";
import { PROD_HOSTNAMES, TRACKED_ROLE, type AnalyticsUser } from "./ga";

/** EU ingest host. Recordings must not leave the EU. */
export const DEFAULT_POSTHOG_HOST = "https://eu.i.posthog.com";

/** The five inputs the guard chain reads, passed in so it can be tested. */
export interface ReplayEnvironment {
  apiKey: string | null | undefined;
  vercelEnv: string | null | undefined;
  hostname: string | null | undefined;
  consent: AnalyticsConsent;
  role: string | null | undefined;
}

/** The slice of the posthog-js client this module drives. */
type ReplayClient = Pick<
  PostHog,
  | "init"
  | "opt_in_capturing"
  | "opt_out_capturing"
  | "startSessionRecording"
  | "stopSessionRecording"
  | "identify"
  | "reset"
>;

/**
 * The guard chain, as a pure function.
 *
 * All five conditions must hold; any one of them failing means posthog-js is
 * never imported and nothing is recorded. Kept free of browser globals so it can
 * be unit-tested without a DOM.
 */
export function shouldRecordSession(env: ReplayEnvironment): boolean {
  if (!env.apiKey?.trim()) {
    return false;
  }

  if (env.vercelEnv !== "production") {
    return false;
  }

  const hostname = env.hostname?.trim().toLowerCase();

  if (!hostname || !PROD_HOSTNAMES.includes(hostname)) {
    return false;
  }

  // Session replay cannot run cookielessly, so anything short of an explicit
  // "accepted" — including an unanswered banner — means no recording.
  if (env.consent !== "granted") {
    return false;
  }

  // Admin and operator sessions are never recorded; see the module comment.
  if (env.role !== TRACKED_ROLE) {
    return false;
  }

  return true;
}

/**
 * The replay-only posthog configuration.
 *
 * Everything that could capture on its own is off, and both switches that let
 * this module control the timing — `opt_out_capturing_by_default` and
 * `disable_session_recording` — start closed, so `init()` cannot record or send
 * anything before `syncSessionReplay` explicitly opts in.
 *
 * Option names are posthog-js 1.420 (`@posthog/types`): the two masking keys
 * live under `session_recording` and are passed straight through to rrweb.
 */
export function buildReplayInitConfig(apiHost: string): Partial<PostHogConfig> {
  return {
    api_host: apiHost,

    // Pins the default set to a known date rather than inheriting whatever a
    // future posthog-js decides. Also injects the recorder into <head>, which
    // is what avoids an SSR hydration mismatch in the App Router.
    defaults: "2026-08-29",

    // Closed until consent is granted. `opt_in_capturing()` opens the first,
    // `startSessionRecording()` opens the second.
    opt_out_capturing_by_default: true,
    disable_session_recording: true,

    // Replay only — GA4 owns every event and page view this app measures.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    disable_surveys: true,
    disable_web_experiments: true,

    // No person profile for anyone who is never identified. Only tenants are
    // recorded and they are identified by UUID, so this is a backstop.
    person_profiles: "identified_only",

    // `identify()` carries `$current_url`; this strips the advertising ids out
    // of it. It does not touch the URL inside the recording itself.
    mask_personal_data_properties: true,

    session_recording: {
      // Every input value, whatever its type.
      maskAllInputs: true,
      // Every rendered text node. Layout, clicks, scrolling and navigation
      // survive; the words do not, so a recording cannot carry a name, an
      // address, a message or a price the user typed.
      maskTextSelector: "*",
    },
  };
}

/** Reads the guard inputs from the environment, the browser and the store. */
export function readReplayEnvironment(
  role: string | null | undefined,
): ReplayEnvironment {
  return {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
    hostname: typeof window === "undefined" ? null : window.location.hostname,
    consent: readAnalyticsConsent(),
    role,
  };
}

/**
 * Whether replay may run right now. False on the server, on staging, on
 * previews, locally, before the banner is accepted, and for every role but
 * tenant.
 */
export function isSessionReplayAllowed(role: string | null | undefined): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return shouldRecordSession(readReplayEnvironment(role));
}

/** Who the provider last saw signed in. Drives both the role gate and identify. */
let currentUser: AnalyticsUser | null = null;

/** Resolves once posthog-js has been fetched and initialised. Null on failure. */
let clientPromise: Promise<ReplayClient | null> | null = null;

/** The initialised client, once it has arrived. */
let client: ReplayClient | null = null;

/** True between `opt_in_capturing()` and the matching `opt_out_capturing()`. */
let active = false;

/** The distinct id currently bound, so an unchanged user is not re-identified. */
let identifiedUserId: string | null = null;

/**
 * Imports and initialises posthog-js, at most once per page load.
 *
 * The import is dynamic so the library sits in its own chunk: a visitor who has
 * not accepted the banner, or who is not on production, never downloads it. A
 * failed chunk fetch resolves to null — replay is optional and must never take
 * the page down with it.
 */
function loadClient(apiKey: string, apiHost: string): Promise<ReplayClient | null> {
  clientPromise ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(apiKey, buildReplayInitConfig(apiHost));
      client = posthog;

      return client;
    })
    .catch(() => null);

  return clientPromise;
}

/** Stops recording and detaches the identity, if any of that is running. */
function suspendRecording(): void {
  if (!client) {
    return;
  }

  if (active) {
    client.stopSessionRecording();
    client.opt_out_capturing();
    active = false;
  }

  if (identifiedUserId) {
    // `reset()` clears the stored consent as well, which with
    // `opt_out_capturing_by_default` leaves the instance opted out — the state
    // we want. It is why the opt-in above has to be re-issued on the next grant.
    client.reset();
    identifiedUserId = null;
  }
}

/**
 * Brings posthog in line with the current gate, consent and user.
 *
 * Safe to call as often as anything changes: it is idempotent, and every branch
 * short-circuits before touching the network unless the full chain passes.
 */
async function applyDesiredState(): Promise<void> {
  if (!isSessionReplayAllowed(currentUser?.role)) {
    suspendRecording();
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();

  if (!apiKey) {
    return;
  }

  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST;

  const posthog = await loadClient(apiKey, apiHost);

  if (!posthog) {
    return;
  }

  // Re-read after the await: the banner can be withdrawn, or the user can sign
  // out, while the chunk is still downloading.
  if (!isSessionReplayAllowed(currentUser?.role)) {
    suspendRecording();
    return;
  }

  if (!active) {
    posthog.opt_in_capturing();
    posthog.startSessionRecording();
    active = true;
  }

  const userId = currentUser?.id ?? null;

  if (userId && userId !== identifiedUserId) {
    // The `users` table UUID, never an email, phone number or name.
    posthog.identify(userId);
    identifiedUserId = userId;
  }
}

/**
 * Re-evaluates the chain after a consent change.
 *
 * This is what `subscribeToConsentChanges` calls, in this tab and when another
 * tab is the one that answered the banner. It takes no arguments on purpose: the
 * role half of the gate lives in module state, so a listener registered once on
 * mount can never read a stale role.
 */
export function syncSessionReplay(): Promise<void> {
  return applyDesiredState();
}

/**
 * Records who is signed in and re-evaluates the chain.
 *
 * Pass `null` on sign-out, which drops the role and therefore stops recording.
 * Mirrors `setAnalyticsUser` in `ga.ts`; the id is the internal UUID.
 */
export function setReplayUser(user: AnalyticsUser | null): Promise<void> {
  currentUser = user;

  return applyDesiredState();
}

/** Test seam: clears the module's state between cases. */
export function resetSessionReplayForTests(): void {
  currentUser = null;
  clientPromise = null;
  client = null;
  active = false;
  identifiedUserId = null;
}
