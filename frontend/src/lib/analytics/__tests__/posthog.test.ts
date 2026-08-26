import { afterEach, describe, expect, it, vi } from "vitest";

import { CONSENT_STORAGE_KEY, type CookieConsentDecision } from "../consent";
import {
  buildReplayInitConfig,
  DEFAULT_POSTHOG_HOST,
  isSessionReplayAllowed,
  resetSessionReplayForTests,
  setReplayUser,
  shouldRecordSession,
  syncSessionReplay,
  type ReplayEnvironment,
} from "../posthog";

/**
 * The suite runs under vitest's `node` environment, so there is no `window`
 * unless a case installs one — the server case is the one that must never touch
 * a browser global. posthog-js itself is replaced by a recorder, because what is
 * under test is *whether* it is reached at all and with what.
 */

const posthogMock = vi.hoisted(() => {
  const calls: Array<{ method: string; args: unknown[] }> = [];

  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
    };

  return {
    calls,
    client: {
      init: record("init"),
      opt_in_capturing: record("opt_in_capturing"),
      opt_out_capturing: record("opt_out_capturing"),
      startSessionRecording: record("startSessionRecording"),
      stopSessionRecording: record("stopSessionRecording"),
      identify: record("identify"),
      reset: record("reset"),
    },
  };
});

vi.mock("posthog-js", () => ({ default: posthogMock.client }));

type FakeWindow = {
  location: { hostname: string };
  localStorage: Pick<Storage, "getItem" | "setItem">;
};

/** Installs a minimal browser global carrying a stored banner decision. */
function installWindow(
  hostname: string,
  consent: CookieConsentDecision | null = null,
): void {
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
  };

  (globalThis as { window?: unknown }).window = fake;
}

function removeWindow(): void {
  delete (globalThis as { window?: unknown }).window;
}

/** The full production configuration, as one call. */
function stubProductionEnv(): void {
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_testkey123");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
}

const methods = () => posthogMock.calls.map((call) => call.method);

const argsOf = (method: string) =>
  posthogMock.calls.find((call) => call.method === method)?.args;

/** A recording tenant, on production, with the banner accepted. */
async function startRecordingSession(): Promise<void> {
  stubProductionEnv();
  installWindow("ta-da.co", "accepted");

  await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });
}

afterEach(() => {
  vi.unstubAllEnvs();
  removeWindow();
  resetSessionReplayForTests();
  posthogMock.calls.length = 0;
});

describe("shouldRecordSession", () => {
  const valid: ReplayEnvironment = {
    apiKey: "phc_testkey123",
    vercelEnv: "production",
    hostname: "ta-da.co",
    consent: "granted",
    role: "tenant",
  };

  it("passes when all five conditions hold", () => {
    expect(shouldRecordSession(valid)).toBe(true);
  });

  it("accepts the www production host, whatever its casing", () => {
    expect(shouldRecordSession({ ...valid, hostname: "www.ta-da.co" })).toBe(
      true,
    );
    expect(shouldRecordSession({ ...valid, hostname: "TA-DA.CO" })).toBe(true);
  });

  it("fails without an api key", () => {
    expect(shouldRecordSession({ ...valid, apiKey: undefined })).toBe(false);
    expect(shouldRecordSession({ ...valid, apiKey: "" })).toBe(false);
    expect(shouldRecordSession({ ...valid, apiKey: "   " })).toBe(false);
  });

  it("fails on a preview deployment — this is the staging case", () => {
    expect(shouldRecordSession({ ...valid, vercelEnv: "preview" })).toBe(false);
    expect(shouldRecordSession({ ...valid, vercelEnv: undefined })).toBe(false);
  });

  it("fails on the staging host even if the rest is production-shaped", () => {
    expect(shouldRecordSession({ ...valid, hostname: "stage.ta-da.co" })).toBe(
      false,
    );
  });

  it("fails on localhost, on preview hosts and with no hostname", () => {
    expect(shouldRecordSession({ ...valid, hostname: "localhost" })).toBe(false);
    expect(
      shouldRecordSession({ ...valid, hostname: "tada-git-develop.vercel.app" }),
    ).toBe(false);
    expect(shouldRecordSession({ ...valid, hostname: null })).toBe(false);
  });

  it("fails when the banner has not been answered — unlike GA4", () => {
    expect(shouldRecordSession({ ...valid, consent: "unset" })).toBe(false);
  });

  it("fails when the banner was rejected", () => {
    expect(shouldRecordSession({ ...valid, consent: "denied" })).toBe(false);
  });

  it("fails for admins and operators", () => {
    expect(shouldRecordSession({ ...valid, role: "admin" })).toBe(false);
    expect(shouldRecordSession({ ...valid, role: "operator" })).toBe(false);
  });

  it("fails when nobody is signed in — anonymous sessions are not recorded", () => {
    expect(shouldRecordSession({ ...valid, role: null })).toBe(false);
    expect(shouldRecordSession({ ...valid, role: undefined })).toBe(false);
  });
});

describe("isSessionReplayAllowed", () => {
  it("is false on the server, however the env is configured", () => {
    stubProductionEnv();

    expect(isSessionReplayAllowed("tenant")).toBe(false);
  });

  it("is true for a tenant who accepted, in a production browser", () => {
    stubProductionEnv();
    installWindow("ta-da.co", "accepted");

    expect(isSessionReplayAllowed("tenant")).toBe(true);
  });

  it("is false for the same tenant before the banner is answered", () => {
    stubProductionEnv();
    installWindow("ta-da.co", null);

    expect(isSessionReplayAllowed("tenant")).toBe(false);
  });
});

describe("buildReplayInitConfig", () => {
  it("masks every input and every rendered text node", () => {
    expect(buildReplayInitConfig(DEFAULT_POSTHOG_HOST).session_recording).toEqual(
      { maskAllInputs: true, maskTextSelector: "*" },
    );
  });

  it("starts opted out and with recording disabled", () => {
    const config = buildReplayInitConfig(DEFAULT_POSTHOG_HOST);

    expect(config.opt_out_capturing_by_default).toBe(true);
    expect(config.disable_session_recording).toBe(true);
  });

  it("captures no product events — GA4 owns those", () => {
    const config = buildReplayInitConfig(DEFAULT_POSTHOG_HOST);

    expect(config.autocapture).toBe(false);
    expect(config.capture_pageview).toBe(false);
    expect(config.capture_pageleave).toBe(false);
    expect(config.capture_heatmaps).toBe(false);
    expect(config.capture_dead_clicks).toBe(false);
    expect(config.capture_exceptions).toBe(false);
    expect(config.disable_surveys).toBe(true);
    expect(config.disable_web_experiments).toBe(true);
  });

  it("sends to the host it is given", () => {
    expect(buildReplayInitConfig("https://eu.i.posthog.com").api_host).toBe(
      "https://eu.i.posthog.com",
    );
  });
});

describe("session replay lifecycle", () => {
  it("records once every gate passes", async () => {
    await startRecordingSession();

    expect(methods()).toEqual([
      "init",
      "opt_in_capturing",
      "startSessionRecording",
      "identify",
    ]);
  });

  it("initialises with the EU host and the masking config", async () => {
    await startRecordingSession();

    expect(argsOf("init")).toEqual([
      "phc_testkey123",
      expect.objectContaining({
        api_host: "https://eu.i.posthog.com",
        session_recording: { maskAllInputs: true, maskTextSelector: "*" },
      }),
    ]);
  });

  it("falls back to the EU host when none is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_testkey123");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    installWindow("ta-da.co", "accepted");

    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });

    expect(argsOf("init")?.[1]).toMatchObject({
      api_host: DEFAULT_POSTHOG_HOST,
    });
  });

  it("identifies by internal UUID and nothing else", async () => {
    await startRecordingSession();

    expect(argsOf("identify")).toEqual(["tenant-uuid-1"]);
  });

  it("does not re-identify an unchanged user", async () => {
    await startRecordingSession();
    await syncSessionReplay();
    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });

    expect(methods().filter((method) => method === "identify")).toHaveLength(1);
  });

  it("imports nothing before the banner is answered", async () => {
    stubProductionEnv();
    installWindow("ta-da.co", null);

    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });

    expect(posthogMock.calls).toHaveLength(0);
  });

  it("imports nothing when the banner was rejected", async () => {
    stubProductionEnv();
    installWindow("ta-da.co", "rejected");

    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });

    expect(posthogMock.calls).toHaveLength(0);
  });

  it("imports nothing on staging, even for a tenant who accepted", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_testkey123");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    installWindow("stage.ta-da.co", "accepted");

    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });
    await syncSessionReplay();

    expect(posthogMock.calls).toHaveLength(0);
  });

  it("imports nothing on a non-production host", async () => {
    stubProductionEnv();
    installWindow("localhost", "accepted");

    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });

    expect(posthogMock.calls).toHaveLength(0);
  });

  it("imports nothing without a key", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    installWindow("ta-da.co", "accepted");

    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });

    expect(posthogMock.calls).toHaveLength(0);
  });

  it("never records an admin or an operator", async () => {
    stubProductionEnv();
    installWindow("ta-da.co", "accepted");

    await setReplayUser({ id: "admin-uuid", role: "admin" });
    await setReplayUser({ id: "operator-uuid", role: "operator" });

    expect(posthogMock.calls).toHaveLength(0);
  });

  it("never records a signed-out visitor", async () => {
    stubProductionEnv();
    installWindow("ta-da.co", "accepted");

    await setReplayUser(null);
    await syncSessionReplay();

    expect(posthogMock.calls).toHaveLength(0);
  });

  it("does nothing on the server", async () => {
    stubProductionEnv();

    await expect(
      setReplayUser({ id: "tenant-uuid-1", role: "tenant" }),
    ).resolves.toBeUndefined();
    expect(posthogMock.calls).toHaveLength(0);
  });

  it("starts recording when the banner is accepted mid-session", async () => {
    stubProductionEnv();
    installWindow("ta-da.co", null);

    await setReplayUser({ id: "tenant-uuid-1", role: "tenant" });
    expect(posthogMock.calls).toHaveLength(0);

    // What the banner does: store the decision, then let the provider sync.
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    await syncSessionReplay();

    expect(methods()).toEqual([
      "init",
      "opt_in_capturing",
      "startSessionRecording",
      "identify",
    ]);
  });

  it("stops recording and opts out when consent is withdrawn", async () => {
    await startRecordingSession();
    posthogMock.calls.length = 0;

    window.localStorage.setItem(CONSENT_STORAGE_KEY, "rejected");
    await syncSessionReplay();

    expect(methods()).toEqual([
      "stopSessionRecording",
      "opt_out_capturing",
      "reset",
    ]);
  });

  it("stops recording on sign-out and clears the identity", async () => {
    await startRecordingSession();
    posthogMock.calls.length = 0;

    await setReplayUser(null);

    expect(methods()).toEqual([
      "stopSessionRecording",
      "opt_out_capturing",
      "reset",
    ]);
  });

  it("stops recording when the session switches to an admin", async () => {
    await startRecordingSession();
    posthogMock.calls.length = 0;

    await setReplayUser({ id: "admin-uuid", role: "admin" });

    expect(methods()).toContain("stopSessionRecording");
    expect(methods()).not.toContain("identify");
  });

  it("re-opts in when a tenant signs back in after a sign-out", async () => {
    await startRecordingSession();
    await setReplayUser(null);
    posthogMock.calls.length = 0;

    await setReplayUser({ id: "tenant-uuid-2", role: "tenant" });

    // No second init: posthog is imported and initialised once per page load.
    expect(methods()).toEqual([
      "opt_in_capturing",
      "startSessionRecording",
      "identify",
    ]);
    expect(argsOf("identify")).toEqual(["tenant-uuid-2"]);
  });

  it("does not opt in twice while it is already recording", async () => {
    await startRecordingSession();
    await syncSessionReplay();
    await syncSessionReplay();

    expect(methods().filter((method) => method === "init")).toHaveLength(1);
    expect(
      methods().filter((method) => method === "opt_in_capturing"),
    ).toHaveLength(1);
    expect(
      methods().filter((method) => method === "startSessionRecording"),
    ).toHaveLength(1);
  });
});
