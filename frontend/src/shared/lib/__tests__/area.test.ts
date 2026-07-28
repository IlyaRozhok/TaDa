import { describe, it, expect } from "vitest";
import {
  sqFtToSqM,
  sqMToSqFt,
  formatAreaDisplay,
  formatSqMForForm,
} from "../area";

describe("sqFtToSqM", () => {
  it("converts square feet to square meters rounded to 2 decimals", () => {
    expect(sqFtToSqM(1000)).toBe(92.9);
    expect(sqFtToSqM(1561)).toBe(145.02);
  });

  it("returns 0 for 0", () => {
    expect(sqFtToSqM(0)).toBe(0);
  });
});

describe("sqMToSqFt", () => {
  it("converts square meters to square feet rounded to nearest integer", () => {
    expect(sqMToSqFt(145)).toBe(1561);
    expect(sqMToSqFt(92.9)).toBe(1000);
  });
});

describe("formatAreaDisplay", () => {
  it("formats square meters as feet-primary with meters in parentheses", () => {
    expect(formatAreaDisplay(145)).toBe("1,561 sq ft (145 m²)");
  });

  it("returns null for null/undefined/invalid input", () => {
    expect(formatAreaDisplay(null)).toBeNull();
    expect(formatAreaDisplay(undefined)).toBeNull();
    expect(formatAreaDisplay(NaN)).toBeNull();
  });
});

describe("formatSqMForForm", () => {
  it("formats with comma decimal separator and 2 decimal places", () => {
    expect(formatSqMForForm(145.02)).toBe("145,02");
    expect(formatSqMForForm(92.9)).toBe("92,90");
  });

  it("returns empty string for null/undefined/invalid input", () => {
    expect(formatSqMForForm(null)).toBe("");
    expect(formatSqMForForm(undefined)).toBe("");
    expect(formatSqMForForm(NaN)).toBe("");
  });
});
