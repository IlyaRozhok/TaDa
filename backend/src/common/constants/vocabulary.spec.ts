import {
  LET_DURATION_LIST_PATTERN,
  normalizeDurationList,
  normalizeVocabularyList,
  normalizeVocabularyValue,
} from "./vocabulary";

describe("vocabulary normalization", () => {
  it("maps every documented furnishing variant to part_furnished", () => {
    expect(normalizeVocabularyValue("part-furnished")).toBe("part_furnished");
    expect(normalizeVocabularyValue("partially_furnished")).toBe("part_furnished");
    expect(normalizeVocabularyValue("Partially-Furnished")).toBe("part_furnished");
    expect(normalizeVocabularyValue("part_furnished")).toBe("part_furnished");
  });

  it("maps co-living to co_living", () => {
    expect(normalizeVocabularyValue("co-living")).toBe("co_living");
    expect(normalizeVocabularyValue("Co-Living")).toBe("co_living");
  });

  it("maps en-suite room to room", () => {
    expect(normalizeVocabularyValue("en-suite room")).toBe("room");
  });

  it("lowercases and trims but never invents values", () => {
    expect(normalizeVocabularyValue("  Apartment ")).toBe("apartment");
    // Unknown values pass through for the validator to reject.
    expect(normalizeVocabularyValue("castle")).toBe("castle");
  });

  it("normalizes arrays element-wise", () => {
    expect(
      normalizeVocabularyList(["furnished", "Part-Furnished", "co-living"]),
    ).toEqual(["furnished", "part_furnished", "co_living"]);
  });

  it("normalizes comma-separated duration lists token by token", () => {
    expect(normalizeDurationList("Short-Term, 12 months")).toBe(
      "short_term,12_months",
    );
    expect(normalizeDurationList("long_term")).toBe("long_term");
  });

  it("the duration pattern accepts canonical lists and rejects drift", () => {
    expect(LET_DURATION_LIST_PATTERN.test("long_term,12_months")).toBe(true);
    expect(LET_DURATION_LIST_PATTERN.test("flexible")).toBe(true);
    expect(LET_DURATION_LIST_PATTERN.test("12 months")).toBe(false);
    expect(LET_DURATION_LIST_PATTERN.test("long-term")).toBe(false);
    expect(LET_DURATION_LIST_PATTERN.test("")).toBe(false);
  });
});
