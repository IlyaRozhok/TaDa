import { afterEach, describe, expect, it } from "vitest";

import {
  ATTRIBUTION_COOKIE_KEY,
  captureAttribution,
  nextAttribution,
  readAttributionFromSearch,
  readStoredAttribution,
  writeStoredAttribution,
  type Attribution,
} from "../attribution";

/**
 * The suite runs under vitest's `node` environment, so `document` only exists
 * where a case installs the cookie jar below — which is what lets the
 * server-side case assert that nothing is touched.
 */

/** A `document.cookie` that behaves like a browser's for what this module does. */
function installCookieJar(initial?: Record<string, string>): Map<string, string> {
  const jar = new Map<string, string>(Object.entries(initial ?? {}));

  const doc = {
    get cookie(): string {
      return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    set cookie(raw: string) {
      const [pair = ""] = raw.split(";");
      const separator = pair.indexOf("=");

      if (separator < 0) return;

      jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1));
    },
  };

  (globalThis as { document?: unknown }).document = doc;
  (globalThis as { window?: unknown }).window = {
    location: { protocol: "https:" },
    document: doc,
  };

  return jar;
}

/** Seeds the cookie the way the browser stores it: JSON, percent-encoded. */
function seedStored(attribution: Attribution): Map<string, string> {
  return installCookieJar({
    [ATTRIBUTION_COOKIE_KEY]: encodeURIComponent(JSON.stringify(attribution)),
  });
}

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
  delete (globalThis as { window?: unknown }).window;
});

describe("readAttributionFromSearch", () => {
  it("picks up the click id and every utm parameter", () => {
    expect(
      readAttributionFromSearch(
        "gclid=CjAbC123&utm_source=google&utm_medium=cpc&utm_campaign=london_rent&utm_term=flat+to+rent&utm_content=ad_a",
      ),
    ).toEqual({
      gclid: "CjAbC123",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "london_rent",
      utm_term: "flat to rent",
      utm_content: "ad_a",
    });
  });

  it("accepts a raw location.search with its leading question mark", () => {
    expect(readAttributionFromSearch("?gclid=abc")).toEqual({ gclid: "abc" });
  });

  it("ignores everything that is not an attribution parameter", () => {
    expect(readAttributionFromSearch("page=2&is_new=1&sort=newest")).toEqual({});
  });

  it("drops empty and whitespace-only values", () => {
    expect(readAttributionFromSearch("gclid=&utm_source=%20%20")).toEqual({});
  });

  it("caps an absurdly long value", () => {
    const captured = readAttributionFromSearch(`gclid=${"x".repeat(1000)}`);

    expect(captured.gclid).toHaveLength(256);
  });

  it("returns nothing for an empty query string", () => {
    expect(readAttributionFromSearch("")).toEqual({});
  });
});

describe("nextAttribution", () => {
  const stored: Attribution = {
    gclid: "first_click",
    utm_source: "google",
    utm_campaign: "london_rent",
  };

  it("stores the first set it sees", () => {
    expect(nextAttribution(null, { gclid: "abc" })).toEqual({ gclid: "abc" });
  });

  it("leaves the stored set alone when the URL carries nothing", () => {
    expect(nextAttribution(stored, {})).toBeNull();
  });

  it("keeps the first touch when a later visit has utm but no click id", () => {
    expect(
      nextAttribution(stored, { utm_source: "newsletter", utm_medium: "email" }),
    ).toBeNull();
  });

  it("keeps the first touch when the same click id comes back", () => {
    expect(
      nextAttribution(stored, { gclid: "first_click", utm_source: "google" }),
    ).toBeNull();
  });

  it("replaces the whole set when a new click id appears", () => {
    expect(
      nextAttribution(stored, { gclid: "second_click", utm_source: "bing" }),
    ).toEqual({ gclid: "second_click", utm_source: "bing" });
  });

  it("does not merge the old campaign into the new click", () => {
    const replaced = nextAttribution(stored, { gclid: "second_click" });

    expect(replaced).toEqual({ gclid: "second_click" });
    expect(replaced?.utm_campaign).toBeUndefined();
  });

  it("treats a stored set without a click id as replaceable by a paid click", () => {
    expect(
      nextAttribution({ utm_source: "newsletter" }, { gclid: "paid" }),
    ).toEqual({ gclid: "paid" });
  });

  it("stores over an empty stored set", () => {
    expect(nextAttribution({}, { utm_source: "google" })).toEqual({
      utm_source: "google",
    });
  });
});

describe("readStoredAttribution", () => {
  it("reads back what was written", () => {
    installCookieJar();
    writeStoredAttribution({ gclid: "abc", utm_source: "google" });

    expect(readStoredAttribution()).toEqual({
      gclid: "abc",
      utm_source: "google",
    });
  });

  it("is null when nothing is stored", () => {
    installCookieJar();

    expect(readStoredAttribution()).toBeNull();
  });

  it("is null on the server, where there is no document", () => {
    expect(readStoredAttribution()).toBeNull();
  });

  it("is null when the cookie is not valid JSON", () => {
    installCookieJar({ [ATTRIBUTION_COOKIE_KEY]: "not-json" });

    expect(readStoredAttribution()).toBeNull();
  });

  it("ignores keys the catalog does not know", () => {
    installCookieJar({
      [ATTRIBUTION_COOKIE_KEY]: encodeURIComponent(
        JSON.stringify({ gclid: "abc", email: "someone@example.com" }),
      ),
    });

    expect(readStoredAttribution()).toEqual({ gclid: "abc" });
  });

  it("ignores non-string values", () => {
    installCookieJar({
      [ATTRIBUTION_COOKIE_KEY]: encodeURIComponent(
        JSON.stringify({ gclid: "abc", utm_source: 42 }),
      ),
    });

    expect(readStoredAttribution()).toEqual({ gclid: "abc" });
  });
});

describe("captureAttribution", () => {
  it("stores the campaign on the first visit", () => {
    installCookieJar();

    captureAttribution("?gclid=abc&utm_source=google&utm_medium=cpc");

    expect(readStoredAttribution()).toEqual({
      gclid: "abc",
      utm_source: "google",
      utm_medium: "cpc",
    });
  });

  it("survives the visit that has no parameters at all — the OAuth callback", () => {
    seedStored({ gclid: "abc", utm_source: "google" });

    // What /app/auth/callback looks like: the backend's own parameters, none
    // of ours.
    const kept = captureAttribution("?is_new=1&success=true");

    expect(kept).toEqual({ gclid: "abc", utm_source: "google" });
    expect(readStoredAttribution()).toEqual({
      gclid: "abc",
      utm_source: "google",
    });
  });

  it("does not blank a stored value out with an empty parameter", () => {
    seedStored({ gclid: "abc", utm_source: "google" });

    captureAttribution("?gclid=&utm_source=");

    expect(readStoredAttribution()).toEqual({
      gclid: "abc",
      utm_source: "google",
    });
  });

  it("keeps the first touch across an organic return visit", () => {
    seedStored({ gclid: "abc", utm_source: "google", utm_medium: "cpc" });

    captureAttribution("?utm_source=facebook&utm_medium=social");

    expect(readStoredAttribution()).toEqual({
      gclid: "abc",
      utm_source: "google",
      utm_medium: "cpc",
    });
  });

  it("replaces the set when the visitor arrives on a new click", () => {
    seedStored({ gclid: "abc", utm_source: "google", utm_campaign: "old" });

    captureAttribution("?gclid=xyz&utm_source=google&utm_campaign=new");

    expect(readStoredAttribution()).toEqual({
      gclid: "xyz",
      utm_source: "google",
      utm_campaign: "new",
    });
  });

  it("is a no-op on the server", () => {
    expect(captureAttribution("?gclid=abc")).toBeNull();
  });

  it("writes a 90-day, path-wide, Secure, Lax cookie", () => {
    const written: string[] = [];
    const doc = {
      cookie: "",
    };

    Object.defineProperty(doc, "cookie", {
      get: () => "",
      set: (raw: string) => void written.push(raw),
    });

    (globalThis as { document?: unknown }).document = doc;
    (globalThis as { window?: unknown }).window = {
      location: { protocol: "https:" },
      document: doc,
    };

    captureAttribution("?gclid=abc");

    expect(written).toHaveLength(1);
    expect(written[0]).toContain(`max-age=${90 * 24 * 60 * 60}`);
    expect(written[0]).toContain("path=/");
    expect(written[0]).toContain("SameSite=Lax");
    expect(written[0]).toContain("Secure");
  });
});
