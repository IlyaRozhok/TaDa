import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getFeedbackFishProjectId,
  getFeedbackFishScriptSrc,
} from "../feedbackFish";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getFeedbackFishProjectId", () => {
  it("returns null when the project id is unset — the widget stays off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID", "");

    expect(getFeedbackFishProjectId()).toBeNull();
  });

  it("treats a whitespace-only value as unset", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID", "   ");

    expect(getFeedbackFishProjectId()).toBeNull();
  });

  it("returns the trimmed id when one is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID", "  abc123  ");

    expect(getFeedbackFishProjectId()).toBe("abc123");
  });
});

describe("getFeedbackFishScriptSrc", () => {
  // ff.js reads its own src back with /(?:\?|&)pid=(\w*)/. The parameter name
  // is the whole integration: `projectId` matched nothing and the widget
  // opened against a null project.
  it("names the query parameter pid, which is what ff.js parses", () => {
    expect(getFeedbackFishScriptSrc("abc123")).toBe(
      "https://feedback.fish/ff.js?pid=abc123",
    );
  });

  it("encodes the id so it cannot break out of the query string", () => {
    expect(getFeedbackFishScriptSrc("a b&c")).toBe(
      "https://feedback.fish/ff.js?pid=a%20b%26c",
    );
  });
});
