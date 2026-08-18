import { afterEach, describe, expect, it, vi } from "vitest";

import { sanitizeSearchQuery } from "../events";
import {
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
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/** Installs a minimal browser global and returns everything gtag received. */
function installWindow(hostname: string): unknown[][] {
  const calls: unknown[][] = [];
  const fake: FakeWindow = {
    location: { hostname },
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
  };

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
