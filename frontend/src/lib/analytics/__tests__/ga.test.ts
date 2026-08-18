import { afterEach, describe, expect, it, vi } from "vitest";

import { CONSENT_STORAGE_KEY, type CookieConsentDecision } from "../consent";
import { resolveAvgMatchScore, sanitizeSearchQuery } from "../events";
import {
  initAnalytics,
  isAnalyticsEnabled,
  resetAnalyticsForTests,
  setAnalyticsUser,
  shouldInitAnalytics,
  track,
} from "../ga";

/**
 * The suite runs under vitest's `node` environment, so there is no `window`
 * unless a case installs one. That is deliberate: the server case is the one
 * that must never touch a browser global.
 */

type FakeWindow = {
  location: { hostname: string };
  localStorage: Pick<Storage, "getItem" | "setItem">;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/**
 * Installs a minimal browser global and returns everything gtag received.
 *
 * Consent defaults to "accepted" so every pre-existing case still describes a
 * fully enabled production browser; the consent gate has its own cases below.
 */
function installWindow(
  hostname: string,
  consent: CookieConsentDecision | null = "accepted",
): unknown[][] {
  const calls: unknown[][] = [];
  const store = new Map<string, string>();

  if (consent) {
    store.set(CONSENT_STORAGE_KEY, consent);
  }

  const fake: FakeWindow = {
    location: { hostname },
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    },
    gtag: (...args: unknown[]) => {
      calls.push(args);
    },
  };

  (globalThis as { window?: unknown }).window = fake;

  return calls;
}

function removeWindow(): void {
  delete (globalThis as { window?: unknown }).window;
}

/** The full production configuration, as one call. */
function stubProductionEnv(): void {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TESTID123");
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
}

afterEach(() => {
  vi.unstubAllEnvs();
  removeWindow();
  resetAnalyticsForTests();
});

describe("shouldInitAnalytics", () => {
  const valid = {
    measurementId: "G-TESTID123",
    vercelEnv: "production",
    hostname: "ta-da.co",
    consent: "granted",
  } as const;

  it("passes when all three conditions hold", () => {
    expect(shouldInitAnalytics(valid)).toBe(true);
  });

  it("accepts the www production host", () => {
    expect(shouldInitAnalytics({ ...valid, hostname: "www.ta-da.co" })).toBe(
      true,
    );
  });

  it("ignores hostname casing", () => {
    expect(shouldInitAnalytics({ ...valid, hostname: "TA-DA.CO" })).toBe(true);
  });

  it("fails without a measurement id", () => {
    expect(shouldInitAnalytics({ ...valid, measurementId: undefined })).toBe(
      false,
    );
    expect(shouldInitAnalytics({ ...valid, measurementId: "" })).toBe(false);
    expect(shouldInitAnalytics({ ...valid, measurementId: "   " })).toBe(false);
  });

  it("fails on a preview deployment — this is the staging case", () => {
    expect(shouldInitAnalytics({ ...valid, vercelEnv: "preview" })).toBe(false);
  });

  it("fails when the vercel env is absent", () => {
    expect(shouldInitAnalytics({ ...valid, vercelEnv: undefined })).toBe(false);
  });

  it("fails on the staging host even if the rest is production-shaped", () => {
    expect(shouldInitAnalytics({ ...valid, hostname: "stage.ta-da.co" })).toBe(
      false,
    );
  });

  it("fails on localhost and on preview hosts", () => {
    expect(shouldInitAnalytics({ ...valid, hostname: "localhost" })).toBe(false);
    expect(
      shouldInitAnalytics({ ...valid, hostname: "tada-git-develop.vercel.app" }),
    ).toBe(false);
  });

  it("fails when the hostname is missing", () => {
    expect(shouldInitAnalytics({ ...valid, hostname: null })).toBe(false);
  });

  it("fails until consent is granted — the unanswered banner case", () => {
    expect(shouldInitAnalytics({ ...valid, consent: "unset" })).toBe(false);
  });

  it("fails when consent is denied", () => {
    expect(shouldInitAnalytics({ ...valid, consent: "denied" })).toBe(false);
  });

  it("still fails on staging even with consent granted", () => {
    expect(
      shouldInitAnalytics({
        ...valid,
        vercelEnv: "preview",
        hostname: "stage.ta-da.co",
      }),
    ).toBe(false);
  });
});

describe("the consent gate", () => {
  it("keeps analytics disabled in production until the banner is answered", () => {
    stubProductionEnv();
    installWindow("ta-da.co", null);

    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("keeps analytics disabled when the banner was rejected", () => {
    stubProductionEnv();
    installWindow("ta-da.co", "rejected");

    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("sends nothing to gtag before consent — no init, no events", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co", null);

    initAnalytics();
    setAnalyticsUser({ id: "user-1", role: "tenant" });
    track({ name: "login", params: { method: "google" } });

    expect(calls).toHaveLength(0);
  });

  it("sends nothing to gtag after a rejection", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co", "rejected");

    initAnalytics();
    setAnalyticsUser({ id: "user-1", role: "tenant" });
    track({ name: "login", params: { method: "google" } });

    expect(calls).toHaveLength(0);
  });

  it("initialises once consent is granted", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co", "accepted");

    initAnalytics();

    expect(calls).toContainEqual([
      "config",
      "G-TESTID123",
      { send_page_view: false },
    ]);
  });

  it("declares Consent Mode v2 defaults as denied before configuring", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co", "accepted");

    initAnalytics();

    const defaultIndex = calls.findIndex(
      ([kind, mode]) => kind === "consent" && mode === "default",
    );
    const configIndex = calls.findIndex(([kind]) => kind === "config");

    expect(calls[defaultIndex]?.[2]).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    expect(defaultIndex).toBeGreaterThanOrEqual(0);
    expect(defaultIndex).toBeLessThan(configIndex);
  });

  it("grants only analytics_storage on acceptance, never the ad signals", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co", "accepted");

    initAnalytics();

    expect(calls).toContainEqual([
      "consent",
      "update",
      { analytics_storage: "granted" },
    ]);
  });

  it("still refuses to initialise on staging once consent is granted", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TESTID123");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    const calls = installWindow("stage.ta-da.co", "accepted");

    initAnalytics();
    setAnalyticsUser({ id: "user-1", role: "tenant" });
    track({ name: "login", params: { method: "google" } });

    expect(calls).toHaveLength(0);
  });

  it("still drops events for admins once consent is granted", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co", "accepted");

    setAnalyticsUser({ id: "admin-1", role: "admin" });
    track({ name: "property_favorited", params: { property_id: "p1" } });

    expect(calls.filter(([kind]) => kind === "event")).toHaveLength(0);
  });
});

describe("isAnalyticsEnabled", () => {
  it("is false on the server, however the env is configured", () => {
    stubProductionEnv();

    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("is true in a fully configured production browser", () => {
    stubProductionEnv();
    installWindow("ta-da.co");

    expect(isAnalyticsEnabled()).toBe(true);
  });

  it("is false on staging", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TESTID123");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    installWindow("stage.ta-da.co");

    expect(isAnalyticsEnabled()).toBe(false);
  });
});

describe("track", () => {
  it("does nothing on the server", () => {
    stubProductionEnv();

    expect(() =>
      track({ name: "login", params: { method: "google" } }),
    ).not.toThrow();
  });

  it("does nothing on staging", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TESTID123");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    const calls = installWindow("stage.ta-da.co");

    setAnalyticsUser({ id: "user-1", role: "tenant" });
    track({ name: "login", params: { method: "google" } });

    expect(calls).toHaveLength(0);
  });

  it("sends the event for a tenant in production", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co");

    setAnalyticsUser({ id: "user-1", role: "tenant" });
    track({ name: "login", params: { method: "google" } });

    expect(calls).toContainEqual([
      "event",
      "login",
      { method: "google" },
    ]);
  });

  it("drops funnel events for admins and operators", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co");

    setAnalyticsUser({ id: "admin-1", role: "admin" });
    track({ name: "property_favorited", params: { property_id: "p1" } });

    setAnalyticsUser({ id: "op-1", role: "operator" });
    track({ name: "property_favorited", params: { property_id: "p1" } });

    expect(calls.filter(([kind]) => kind === "event")).toHaveLength(0);
  });

  it("drops funnel events when nobody is signed in", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co");

    track({ name: "onboarding_started", params: {} });

    expect(calls.filter(([kind]) => kind === "event")).toHaveLength(0);
  });
});

describe("setAnalyticsUser", () => {
  it("sets the internal id, and no email or phone, for any role", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co");

    setAnalyticsUser({ id: "6b1f-uuid", role: "admin" });

    expect(calls).toContainEqual(["set", { user_id: "6b1f-uuid" }]);
  });

  it("clears the id on sign-out", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co");

    setAnalyticsUser({ id: "6b1f-uuid", role: "tenant" });
    setAnalyticsUser(null);

    expect(calls).toContainEqual(["set", { user_id: null }]);
  });

  it("stops sending funnel events once the user is cleared", () => {
    stubProductionEnv();
    const calls = installWindow("ta-da.co");

    setAnalyticsUser({ id: "6b1f-uuid", role: "tenant" });
    setAnalyticsUser(null);
    track({ name: "onboarding_started", params: {} });

    expect(calls.filter(([kind]) => kind === "event")).toHaveLength(0);
  });
});

describe("resolveAvgMatchScore", () => {
  it("reports the server's full-set mean, not the page it was given", () => {
    expect(resolveAvgMatchScore(63.4, [90, 88, 85])).toBe(63.4);
  });

  it("reports a full-set mean of zero as zero", () => {
    expect(resolveAvgMatchScore(0, [90, 88])).toBe(0);
  });

  it("falls back to the resolved page when the server sends no aggregate", () => {
    // An older payload, and a set the server had nothing to average.
    expect(resolveAvgMatchScore(undefined, [80, 71, 62])).toBe(71);
    expect(resolveAvgMatchScore(null, [80, 71, 62])).toBe(71);
  });

  it("rounds the fallback to one decimal", () => {
    expect(resolveAvgMatchScore(undefined, [80, 75, 71])).toBe(75.3);
  });

  it("reports the mean of nothing as 0 — the empty-feed case", () => {
    expect(resolveAvgMatchScore(null, [])).toBe(0);
  });
});

describe("sanitizeSearchQuery", () => {
  it("trims and keeps an ordinary query", () => {
    expect(sanitizeSearchQuery("  Camden Town  ")).toBe("Camden Town");
  });

  it("drops an empty or blank query", () => {
    expect(sanitizeSearchQuery("")).toBeUndefined();
    expect(sanitizeSearchQuery("   ")).toBeUndefined();
  });

  it("drops anything containing an email marker", () => {
    expect(sanitizeSearchQuery("someone@example.com")).toBeUndefined();
  });

  it("drops phone-like digit runs", () => {
    expect(sanitizeSearchQuery("07700900123")).toBeUndefined();
    expect(sanitizeSearchQuery("call me on 1234567")).toBeUndefined();
  });

  it("keeps short digit groups such as postcodes and prices", () => {
    expect(sanitizeSearchQuery("SW1A 1AA")).toBe("SW1A 1AA");
    expect(sanitizeSearchQuery("2 bed under 2500")).toBe("2 bed under 2500");
  });

  it("caps the length at 100 characters", () => {
    const long = "a".repeat(250);

    expect(sanitizeSearchQuery(long)).toHaveLength(100);
  });
});
