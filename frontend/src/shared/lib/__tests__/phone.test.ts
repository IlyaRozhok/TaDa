import { describe, expect, it } from "vitest";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js/max";

import {
  PHONE_ISSUE_MESSAGES,
  PHONE_REQUIRED_MESSAGE,
  detectPhoneCountry,
  formatPhoneForDisplay,
  formatPhoneInput,
  hasPhoneDigits,
  isValidPhone,
  phoneErrorMessage,
  phoneIssue,
  phoneLinks,
  processPhone,
  splitValidPhone,
  toE164,
} from "../phone";
import { parseStoredPhone } from "../countries";

/**
 * The spec's UK rules and real-case tables. The backend's
 * `common/phone/phone.spec.ts` carries the same tables against its mirror of
 * `processPhone`; keep the two in step.
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

  it("treats an empty field as an error only when required", () => {
    expect(processPhone("", "GB").issue).toBe("EMPTY");
    expect(phoneErrorMessage("", "GB")).toBeUndefined();
    expect(phoneErrorMessage("", "GB", { required: true })).toBe(PHONE_REQUIRED_MESSAGE);
  });

  it("rejects abc123", () => {
    expect(processPhone("abc123", "GB")).toMatchObject({ e164: null, issue: "INVALID" });
  });
});

/**
 * The dropdown country and the number field are separate: the number must be
 * parsed as a NATIONAL number of the selected country (libphonenumber drops
 * the trunk "0"), never glued onto the dial code — "+380" + "0934839253"
 * would be the invalid "+3800934839253".
 */
describe("trunk prefix with a separate country dropdown", () => {
  it.each([
    // [country, as typed, E.164]
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
    expect(toE164(typed, country)).toBe(e164);
    // The trunk 0 never survives behind the calling code ("+3800…", "+440…").
    expect(e164.startsWith(`+${getCountryCallingCode(country as CountryCode)}0`)).toBe(false);
  });

  it.each([
    "0934839253",
    "093 483 9253",
    "+380934839253",
    "+380 93 483 9253",
    "380934839253",
    "00380934839253",
    "+380 (0)93 483 9253",
  ])("UA selected, %s → +380934839253 (no double code, no kept trunk 0)", (typed) => {
    expect(toE164(typed, "UA")).toBe("+380934839253");
  });

  it("formats what the field shows without breaking the conversion", () => {
    const shown = formatPhoneInput("0934839253", "UA");
    expect(shown.replace(/\D/g, "")).toBe("0934839253");
    expect(toE164(shown, "UA")).toBe("+380934839253");
  });

  it("round-trips a stored UA number through the field", () => {
    const parsed = parseStoredPhone("+380934839253");
    expect(parsed?.country.code).toBe("UA");
    expect(toE164(parsed!.nationalNumber, "UA")).toBe("+380934839253");
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
    expect(processPhone("070 4123 0790", "GB").issue).toBe("NOT_MOBILE"); // UK personal number
    expect(processPhone("(201) 555-0123", "US").e164).toBe("+12015550123");
  });

  it("7. returns E.164", () => {
    expect(processPhone("07123 456789", "GB").e164).toMatch(/^\+[1-9]\d{7,14}$/);
  });
});

describe("error messages", () => {
  it("carries the spec's English texts", () => {
    expect(PHONE_ISSUE_MESSAGES).toEqual({
      TOO_SHORT: "Number is too short — please check it",
      TOO_LONG: "Number is too long — please check it",
      NOT_MOBILE: "Please enter a mobile number",
      INVALID: "Please enter a valid phone number",
    });
  });

  it.each([
    ["0712345678", "Number is too short — please check it"],
    ["071234567890", "Number is too long — please check it"],
    ["01632 960123", "Please enter a mobile number"],
    ["abc123", "Please enter a valid phone number"],
    ["07123 456789", undefined],
  ])("%s → %s", (input, message) => {
    expect(phoneErrorMessage(input, "GB")).toBe(message);
  });

  it("phoneIssue never reports EMPTY", () => {
    expect(phoneIssue("", "GB")).toBeUndefined();
    expect(phoneIssue("0712345678", "GB")).toBe("TOO_SHORT");
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

  it("validates with the API's full metadata, not the smaller default set", () => {
    // Accepted by libphonenumber's default "min" metadata, rejected by the
    // "max" set the backend validates with: the form must agree.
    expect(isValidPhone("0501234567", "IL")).toBe(false);
  });
});

describe("formatPhoneInput / detectPhoneCountry", () => {
  it("formats as the user types and never truncates", () => {
    expect(formatPhoneInput("07400883369", "GB")).toBe("07400 883369");
    expect(formatPhoneInput("2015550123", "US")).toBe("(201) 555-0123");
    expect(formatPhoneInput("071234567890123", "GB").replace(/\D/g, "")).toBe("071234567890123");
    expect(phoneIssue("071234567890123", "GB")).toBe("TOO_LONG");
  });

  it("formats internationally once typed with + or 00", () => {
    expect(formatPhoneInput("+33612345678", "GB")).toBe("+33 6 12 34 56 78");
    expect(formatPhoneInput("0033612345678", "GB")).toBe("+33 6 12 34 56 78");
  });

  it("detects the country of an internationally typed number", () => {
    expect(detectPhoneCountry("+1 (212) 555-0123")).toBe("US");
    expect(detectPhoneCountry("+33 6 12 34 56 78")).toBe("FR");
    expect(detectPhoneCountry("0044 7123 456789")).toBe("GB");
    expect(detectPhoneCountry("07123 456789")).toBeUndefined();
  });

  it("detects whether the field holds digits", () => {
    expect(hasPhoneDigits("")).toBe(false);
    expect(hasPhoneDigits(" ( ) ")).toBe(false);
    expect(hasPhoneDigits("0")).toBe(true);
  });
});

describe("display and links", () => {
  it.each([
    ["+447400883369", "07400 883369"],
    ["+33612345678", "+33 6 12 34 56 78"],
    ["+12125550123", "+1 212 555 0123"],
    ["+447041 23079", "+447041 23079"], // legacy invalid value: shown as stored
    ["", ""],
  ])("formats %s for staff as %s", (stored, shown) => {
    expect(formatPhoneForDisplay(stored)).toBe(shown);
  });

  it("reads a legacy national value with its country", () => {
    expect(formatPhoneForDisplay("20 7946 0000", "GB")).toBe("020 7946 0000");
  });

  it("builds tel: and WhatsApp links from E.164", () => {
    expect(phoneLinks("+447400883369")).toEqual({
      tel: "tel:+447400883369",
      whatsapp: "https://wa.me/447400883369",
    });
    expect(phoneLinks("07400 883369", "GB")?.tel).toBe("tel:+447400883369");
  });

  it("gives no links for a value that is not a valid number", () => {
    expect(phoneLinks("+447041 23079")).toBeNull();
    expect(phoneLinks(null)).toBeNull();
  });
});

describe("splitValidPhone / parseStoredPhone round trips", () => {
  it("splits a valid E.164 into country and national display", () => {
    expect(splitValidPhone("+447400883369")).toEqual({ country: "GB", national: "07400 883369" });
    expect(splitValidPhone("+447041 23079")).toBeNull();
  });

  it("round-trips E.164 through the input's national form", () => {
    for (const e164 of ["+447123456789", "+4915123456789", "+12015550123", "+33612345678"]) {
      const parsed = parseStoredPhone(e164);
      expect(parsed).not.toBeNull();
      expect(toE164(parsed!.nationalNumber, parsed!.country.code)).toBe(e164);
    }
  });

  it("reads a legacy spaced value that is still valid", () => {
    const parsed = parseStoredPhone("+447123 456789");
    expect(parsed?.country.code).toBe("GB");
    expect(toE164(parsed!.nationalNumber, "GB")).toBe("+447123456789");
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
