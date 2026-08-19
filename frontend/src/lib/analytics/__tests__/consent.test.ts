import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  hasConsentDecision,
  openCookieSettings,
  persistConsentDecision,
  readAnalyticsConsent,
  readConsentDecision,
  subscribeToConsentChanges,
} from "../consent";

/**
 * Runs under vitest's `node` environment, so a case that wants a browser has to
 * install one. The server case — no window at all — is the one that matters
 * most: it must read as "unset", never as granted.
 */
function installWindow(stored?: string): {
  listeners: Map<string, Array<(event: unknown) => void>>;
  dispatched: string[];
} {
  const store = new Map<string, string>();
  const listeners = new Map<string, Array<(event: unknown) => void>>();
  const dispatched: string[] = [];

  if (stored !== undefined) {
    store.set(CONSENT_STORAGE_KEY, stored);
  }

  const fake = {
    location: { hostname: "ta-da.co", protocol: "https:" },
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    },
    addEventListener: (type: string, fn: (event: unknown) => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
    },
    removeEventListener: (type: string, fn: (event: unknown) => void) => {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((entry) => entry !== fn),
      );
    },
    dispatchEvent: (event: { type: string }) => {
      dispatched.push(event.type);
      (listeners.get(event.type) ?? []).forEach((fn) => fn(event));
      return true;
    },
    CustomEvent: class {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
  };

  (globalThis as { window?: unknown }).window = fake;
  // `persistConsentDecision` constructs a CustomEvent; node's global has one
  // only from v19, so pin the fake's implementation for every environment.
  (globalThis as { CustomEvent?: unknown }).CustomEvent = fake.CustomEvent;

  return { listeners, dispatched };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("readAnalyticsConsent", () => {
  it("is unset on the server", () => {
    expect(readAnalyticsConsent()).toBe("unset");
    expect(readConsentDecision()).toBeNull();
    expect(hasConsentDecision()).toBe(false);
  });

  it("is unset when the user has not answered the banner", () => {
    installWindow();

    expect(readAnalyticsConsent()).toBe("unset");
    expect(hasConsentDecision()).toBe(false);
  });

  it("maps the stored banner decisions onto analytics consent", () => {
    installWindow("accepted");
    expect(readAnalyticsConsent()).toBe("granted");

    installWindow("rejected");
    expect(readAnalyticsConsent()).toBe("denied");
  });

  it("ignores a stored value it does not recognise", () => {
    installWindow("yes-please");

    expect(readAnalyticsConsent()).toBe("unset");
    expect(hasConsentDecision()).toBe(false);
  });

  it("is unset when localStorage throws, rather than granted", () => {
    (globalThis as { window?: unknown }).window = {
      location: { hostname: "ta-da.co", protocol: "https:" },
      localStorage: {
        getItem: () => {
          throw new Error("storage blocked");
        },
      },
    };

    expect(readAnalyticsConsent()).toBe("unset");
  });
});

describe("persistConsentDecision", () => {
  it("stores the decision and announces it", () => {
    const { dispatched } = installWindow();

    persistConsentDecision("accepted");

    expect(readAnalyticsConsent()).toBe("granted");
    expect(dispatched).toContain(CONSENT_CHANGED_EVENT);
  });

  it("lets a granted decision be withdrawn", () => {
    installWindow();

    persistConsentDecision("accepted");
    persistConsentDecision("rejected");

    expect(readAnalyticsConsent()).toBe("denied");
  });
});

describe("subscribeToConsentChanges", () => {
  it("fires on a decision made in this tab and stops after unsubscribing", () => {
    installWindow();
    const listener = vi.fn();

    const unsubscribe = subscribeToConsentChanges(listener);
    persistConsentDecision("accepted");

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    persistConsentDecision("rejected");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("fires when another tab writes the decision", () => {
    const { listeners } = installWindow();
    const listener = vi.fn();

    subscribeToConsentChanges(listener);
    listeners
      .get("storage")
      ?.forEach((fn) => fn({ key: CONSENT_STORAGE_KEY }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores unrelated storage keys", () => {
    const { listeners } = installWindow();
    const listener = vi.fn();

    subscribeToConsentChanges(listener);
    listeners.get("storage")?.forEach((fn) => fn({ key: "tada_language" }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("is a no-op subscription on the server", () => {
    expect(() => subscribeToConsentChanges(() => {})()).not.toThrow();
  });
});

describe("openCookieSettings", () => {
  it("asks the banner to reopen", () => {
    const { dispatched } = installWindow("rejected");

    openCookieSettings();

    expect(dispatched).toContain("tada:openCookieSettings");
  });

  it("does nothing on the server", () => {
    expect(() => openCookieSettings()).not.toThrow();
  });
});
