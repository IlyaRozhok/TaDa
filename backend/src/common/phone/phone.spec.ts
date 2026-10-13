import {
  PHONE_ISSUE_MESSAGES,
  isValidPhone,
  normalizePhone,
  phoneColumns,
  phoneUpdate,
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

/**
 * Mirrors the frontend's trunk-prefix table: a national number of the
 * selected country loses its trunk "0" — "+380" + "0934839253" is
 * +380934839253, never the invalid "+3800934839253".
 */
describe("processPhone — trunk prefix with a separate country", () => {
  it.each([
    ["UA", "0934839253", "+380934839253"],
    ["UA", "093 483 9253", "+380934839253"],
    ["UA", "(093) 483-92-53", "+380934839253"],
    ["UA", "934839253", "+380934839253"],
    ["GB", "07400 883369", "+447400883369"],
    ["FR", "06 12 34 56 78", "+33612345678"],
    ["DE", "01512 3456789", "+4915123456789"],
    ["IE", "085 123 4567", "+353851234567"],
    ["NL", "06 12345678", "+31612345678"],
    ["AT", "0664 1234567", "+436641234567"],
    ["RO", "0712 345 678", "+40712345678"],
    ["PL", "512 345 678", "+48512345678"],
  ])("%s %s → %s", (country, typed, e164) => {
    expect(processPhone(typed, country)).toEqual({ e164, country });
  });

  it.each(["0934839253", "+380934839253", "+380 93 483 9253", "380934839253", "00380934839253", "+380 (0)93 483 9253"])(
    "UA selected, %s → +380934839253",
    (typed) => {
      expect(processPhone(typed, "UA").e164).toBe("+380934839253");
    },
  );

  it("stores a call request typed nationally with its country, trunk 0 dropped", () => {
    expect(phoneColumns("093 483 9253", "UA")).toEqual({ phone: "+380934839253", phone_country: "UA" });
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

describe("processPhone — Crown Dependencies under +44 (GG, JE, IM)", () => {
  it.each([
    ["07781 123456", "+447781123456", "GG"],
    ["07797 123456", "+447797123456", "JE"],
    ["07624 123456", "+447624123456", "IM"],
  ])("accepts %s, typed under GB, as a valid mobile of its own country", (typed, e164, country) => {
    expect(processPhone(typed, "GB")).toMatchObject({ e164, country });
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

describe("phoneUpdate — a changed number loses its verification", () => {
  it("keeps the verification when the number is the same (any formatting)", () => {
    expect(phoneUpdate("+44 7123 456789", "+447123456789")).toEqual({
      phone: "+447123456789",
      phone_country: "GB",
    });
  });

  it("clears the verification for a different number", () => {
    expect(phoneUpdate("+447400883369", "+447123456789")).toEqual({
      phone: "+447400883369",
      phone_country: "GB",
      phone_verified_at: null,
    });
  });

  it("clears it when the number is removed, and when one is first added", () => {
    expect(phoneUpdate("", "+447123456789")).toMatchObject({ phone: null, phone_verified_at: null });
    expect(phoneUpdate("+447123456789", null)).toMatchObject({ phone_verified_at: null });
  });

  it("keeps it when there was no number and still is none", () => {
    expect(phoneUpdate("", null)).toEqual({ phone: null, phone_country: null });
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
