import { describe, expect, it } from "vitest";

import {
  formatPhoneInput,
  hasPhoneDigits,
  isValidPhone,
  phoneIssue,
  splitValidPhone,
  toE164,
} from "../phone";
import { parseStoredPhone } from "../countries";

describe("UK numbers", () => {
  it("normalises a number typed with the trunk 0 without losing a digit", () => {
    expect(toE164("07041230790", "GB")).toBe("+447041230790");
    expect(toE164("07911123456", "GB")).toBe("+447911123456");
  });

  it("gives the same E.164 for national, international and pasted forms", () => {
    for (const input of [
      "07041230790",
      "070 4123 0790",
      "7041230790",
      "+447041230790",
      "+44 70 4123 0790",
      "(0)7041-230-790",
    ]) {
      expect(toE164(input, "GB")).toBe("+447041230790");
    }
  });

  it("keeps all 10 national digits and no stray 0 in E.164", () => {
    const e164 = toE164("07911 123456", "GB") as string;
    expect(e164.startsWith("+440")).toBe(false);
    expect(e164.slice(3)).toHaveLength(10);
  });

  it("formats as the user types and never truncates", () => {
    expect(formatPhoneInput("07911123456", "GB")).toBe("07911 123456");
    // Past the plan's maximum the digits stay; validation flags it instead.
    expect(formatPhoneInput("079111234567890", "GB").replace(/\D/g, "")).toBe(
      "079111234567890",
    );
    expect(phoneIssue("079111234567890", "GB")).toBe("TOO_LONG");
  });

  it("rejects the truncated 9-digit number from the bug report", () => {
    expect(isValidPhone("704123079", "GB")).toBe(false);
    expect(isValidPhone("+447041 23079", "GB")).toBe(false);
    expect(toE164("+447041 23079", "GB")).toBeNull();
    expect(phoneIssue("704123079", "GB")).toBeDefined();
  });
});

describe("countries whose old masks were too short", () => {
  // [country, typed national number, expected E.164]
  const cases: Array<[string, string, string]> = [
    ["DE", "015123456789", "+4915123456789"],
    ["JP", "09012345678", "+819012345678"],
    ["MX", "5512345678", "+525512345678"],
    ["KR", "01012345678", "+821012345678"],
    ["TW", "0912345678", "+886912345678"],
    ["TH", "0812345678", "+66812345678"],
    ["MY", "0123456789", "+60123456789"],
    ["SA", "0501234567", "+966501234567"],
    ["AE", "0501234567", "+971501234567"],
    ["IL", "0502345678", "+972502345678"],
  ];

  it.each(cases)("%s %s → %s at full length", (country, input, e164) => {
    expect(isValidPhone(input, country)).toBe(true);
    expect(toE164(input, country)).toBe(e164);
    // Formatting keeps every digit the user typed.
    expect(formatPhoneInput(input, country).replace(/\D/g, "")).toBe(input);
  });
});

describe("US and other cases", () => {
  it("handles a US number", () => {
    expect(formatPhoneInput("2015550123", "US")).toBe("(201) 555-0123");
    expect(toE164("(201) 555-0123", "US")).toBe("+12015550123");
  });

  it("treats incomplete or junk input as invalid", () => {
    expect(isValidPhone("555", "US")).toBe(false);
    expect(phoneIssue("555", "US")).toBe("TOO_SHORT");
    expect(isValidPhone("abc", "GB")).toBe(false);
    expect(toE164("", "GB")).toBeNull();
    expect(toE164(null, "GB")).toBeNull();
  });

  it("reports no issue for an empty or valid number", () => {
    expect(phoneIssue("", "GB")).toBeUndefined();
    expect(phoneIssue("07911123456", "GB")).toBeUndefined();
  });

  it("detects whether the field holds digits", () => {
    expect(hasPhoneDigits("")).toBe(false);
    expect(hasPhoneDigits(" ( ) ")).toBe(false);
    expect(hasPhoneDigits("0")).toBe(true);
  });

  it("validates with the API's full metadata, not the smaller default set", () => {
    // Accepted by libphonenumber's default "min" metadata, rejected by the
    // "max" set the backend's @IsPhoneNumber uses: the form must agree.
    expect(isValidPhone("0501234567", "IL")).toBe(false);
  });

  it("falls back to no country for an unknown code", () => {
    expect(toE164("+447911123456", "XX")).toBe("+447911123456");
  });
});

describe("splitValidPhone / parseStoredPhone round trips", () => {
  it("splits a valid E.164 into country and national display", () => {
    expect(splitValidPhone("+447041230790")).toEqual({
      country: "GB",
      national: "070 4123 0790",
    });
    expect(splitValidPhone("+447041 23079")).toBeNull();
  });

  it("round-trips E.164 through the input's national form", () => {
    for (const e164 of ["+447911123456", "+4915123456789", "+12015550123", "+33612345678"]) {
      const parsed = parseStoredPhone(e164);
      expect(parsed).not.toBeNull();
      expect(toE164(parsed!.nationalNumber, parsed!.country.code)).toBe(e164);
    }
  });

  it("reads a legacy spaced value that is still valid", () => {
    const parsed = parseStoredPhone("+447911 123456");
    expect(parsed?.country.code).toBe("GB");
    expect(toE164(parsed!.nationalNumber, "GB")).toBe("+447911123456");
  });

  it("keeps a legacy invalid value visible for correction", () => {
    expect(parseStoredPhone("+447041 23079")).toEqual({
      country: expect.objectContaining({ code: "GB" }),
      nationalNumber: "7041 23079",
    });
    expect(parseStoredPhone("+380(93)399-91-81")?.country.code).toBe("UA");
  });

  it("returns null for an empty or unrecognisable value", () => {
    expect(parseStoredPhone("")).toBeNull();
    expect(parseStoredPhone("12345")).toBeNull();
  });
});
