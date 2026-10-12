import {
  PHONE_ISSUE_MESSAGES,
  isValidPhone,
  normalizePhone,
  phoneColumns,
  processPhone,
} from "./phone";

/**
 * The spec's UK rules and real-case tables. The frontend's
 * `shared/lib/__tests__/phone.test.ts` carries the same tables against its
 * mirror of `processPhone`; keep the two in step.
 */
describe("processPhone — UK rules table", () => {
  it.each([
    "07123 456789",
    "07123456789",
    "+44 7123 456789",
    "+447123456789",
    "+44 07123 456789",
    "+44 (0)7123 456789",
    "447123456789",
    "00447123456789",
    "7123456789",
  ])("%s → +447123456789", (input) => {
    expect(processPhone(input, "GB")).toEqual({ e164: "+447123456789", country: "GB" });
  });

  it.each([
    ["0712345678", "TOO_SHORT"],
    ["071234567890", "TOO_LONG"],
    ["01632 960123", "NOT_MOBILE"],
  ])("%s is rejected as %s", (input, issue) => {
    expect(processPhone(input, "GB")).toMatchObject({ e164: null, issue });
  });
});

describe("processPhone — real cases", () => {
  it.each([
    ["07400 883369", "GB", "+447400883369", "GB"],
    ["(07400) 883-369", "GB", "+447400883369", "GB"],
    ["+1 (212) 555-0123", "GB", "+12125550123", "US"],
    ["2125550123", "US", "+12125550123", "US"],
    ["06 12 34 56 78", "FR", "+33612345678", "FR"],
    ["+33 6 12 34 56 78", "GB", "+33612345678", "FR"],
  ])("%s (%s) → %s, country %s", (input, selected, e164, country) => {
    expect(processPhone(input, selected)).toEqual({ e164, country });
  });

  it("rejects +440740 088369 as too short", () => {
    expect(processPhone("+440740 088369", "GB")).toMatchObject({ e164: null, issue: "TOO_SHORT" });
  });

  it("reports an empty value as EMPTY (the caller decides if it is required)", () => {
    expect(processPhone("", "GB").issue).toBe("EMPTY");
    expect(processPhone("  ( ) ", "GB").issue).toBe("EMPTY");
    expect(processPhone(null, "GB").issue).toBe("EMPTY");
  });

  it("rejects abc123", () => {
    expect(processPhone("abc123", "GB")).toMatchObject({ e164: null, issue: "INVALID" });
  });
});

describe("processPhone — each step of the processing order", () => {
  it("1. strips spaces, brackets, hyphens and dots", () => {
    expect(processPhone(" (07123) 456-789 ", "GB").e164).toBe("+447123456789");
    expect(processPhone("07123.456.789", "GB").e164).toBe("+447123456789");
  });

  it("2. parses a leading + as international, whatever country is selected", () => {
    expect(processPhone("+447123456789", "FR")).toEqual({ e164: "+447123456789", country: "GB" });
  });

  it("3. turns a leading 00 into +", () => {
    expect(processPhone("0033612345678", "GB")).toEqual({ e164: "+33612345678", country: "FR" });
  });

  it("4. parses anything else as a national number of the selected country", () => {
    expect(processPhone("0612345678", "FR").e164).toBe("+33612345678");
    expect(processPhone("0612345678", "GB").e164).toBeNull();
  });

  it("5. retries with + when the digits start with the selected calling code", () => {
    expect(processPhone("33612345678", "FR").e164).toBe("+33612345678");
    expect(processPhone("447123456789", "GB").e164).toBe("+447123456789");
  });

  it("6. requires a mobile; North American FIXED_LINE_OR_MOBILE counts", () => {
    expect(processPhone("020 7946 0000", "GB").issue).toBe("NOT_MOBILE");
    expect(processPhone("070 4123 0790", "GB").issue).toBe("NOT_MOBILE"); // personal number
    expect(processPhone("(201) 555-0123", "US").e164).toBe("+12015550123");
  });

  it("7. returns E.164", () => {
    expect(processPhone("07123 456789", "GB").e164).toMatch(/^\+[1-9]\d{7,14}$/);
  });

  it("needs a country for a national number", () => {
    expect(processPhone("07123456789").e164).toBeNull();
    expect(processPhone("07123456789", "XX").e164).toBeNull();
  });
});

describe("PHONE_ISSUE_MESSAGES", () => {
  it("carries the spec's English texts", () => {
    expect(PHONE_ISSUE_MESSAGES).toEqual({
      TOO_SHORT: "Number is too short — please check it",
      TOO_LONG: "Number is too long — please check it",
      NOT_MOBILE: "Please enter a mobile number",
      INVALID: "Please enter a valid phone number",
    });
  });
});

describe("normalizePhone / isValidPhone / phoneColumns", () => {
  it("normalises every formatting of a mobile to one E.164 value", () => {
    for (const input of ["+447123456789", "+44 7123 456789", "+44 (0)7123 456789", " 00447123456789 "]) {
      expect(normalizePhone(input)).toBe("+447123456789");
    }
    expect(normalizePhone("07123 456789", "gb")).toBe("+447123456789");
  });

  it("returns null for blank and keeps an unprocessable value trimmed", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone(" +447041 23079 ")).toBe("+447041 23079");
  });

  it("isValidPhone accepts only valid mobiles", () => {
    expect(isValidPhone("+447123456789")).toBe(true);
    expect(isValidPhone("+442079460000")).toBe(false);
    expect(isValidPhone("+447041 23079")).toBe(false);
    expect(isValidPhone(447123456789)).toBe(false);
  });

  it("phoneColumns pairs E.164 with its country, and clears both to null", () => {
    expect(phoneColumns("+44 7123 456789")).toEqual({ phone: "+447123456789", phone_country: "GB" });
    expect(phoneColumns("+1 212 555 0123")).toEqual({ phone: "+12125550123", phone_country: "US" });
    expect(phoneColumns("")).toEqual({ phone: null, phone_country: null });
    expect(phoneColumns(null)).toEqual({ phone: null, phone_country: null });
  });
});
