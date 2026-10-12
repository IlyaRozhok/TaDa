import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
  type Examples,
  type PhoneNumber,
} from "libphonenumber-js/max";
import * as examplesModule from "libphonenumber-js/mobile/examples";

// A plain JSON object under CommonJS (no `default` without esModuleInterop),
// a default export under ESM — accept either.
const mobileExamples = ((examplesModule as unknown as { default?: Examples }).default ??
  examplesModule) as unknown as Examples;

/**
 * Server-side phone processing — the same rules, in the same order, as the
 * frontend's `shared/lib/phone.ts` (the two apps share no package, so the
 * logic is mirrored and both sides carry the same test table).
 *
 * "max" metadata, the full set: the smaller default disagrees on some
 * numbers, and client and server must never disagree about one.
 *
 * Only mobile numbers are accepted. `FIXED_LINE_OR_MOBILE` counts as mobile:
 * in the US, Canada and Mexico the numbering plan cannot tell the two apart,
 * so rejecting it would reject every North American number.
 */

export type PhoneIssue = "EMPTY" | "TOO_SHORT" | "TOO_LONG" | "NOT_MOBILE" | "INVALID";

export interface PhoneResult {
  /** E.164 (`+447123456789`) when the number is a valid mobile, else null. */
  e164: string | null;
  /** ISO country of the parsed number, when it could be determined. */
  country: string | null;
  issue?: PhoneIssue;
}

/** The English messages the spec fixes for each issue. */
export const PHONE_ISSUE_MESSAGES: Record<Exclude<PhoneIssue, "EMPTY">, string> = {
  TOO_SHORT: "Number is too short — please check it",
  TOO_LONG: "Number is too long — please check it",
  NOT_MOBILE: "Please enter a mobile number",
  INVALID: "Please enter a valid phone number",
};

const MOBILE_TYPES = new Set(["MOBILE", "FIXED_LINE_OR_MOBILE"]);

const asCountry = (country?: string | null): CountryCode | undefined => {
  const upper = country?.toUpperCase();
  return upper && isSupportedCountry(upper) ? (upper as CountryCode) : undefined;
};

/**
 * The country whose plan describes a number with this calling code: the
 * selected one when it shares the code, else the first that has it.
 */
function countryForCallingCode(code: string, selected?: CountryCode): CountryCode | undefined {
  if (selected && getCountryCallingCode(selected) === code) return selected;
  return getCountries().find((c) => getCountryCallingCode(c) === code);
}

/**
 * Why an invalid number fails. The library's own length check catches the
 * plainly short or long; otherwise the national number is measured against
 * the country's example mobile — a GB "0712345678" is a possible length for
 * *some* UK number, but a digit short of any mobile — and a number whose
 * leading digit no mobile has ("01632 960123") is reported as not mobile.
 */
function classifyInvalid(
  candidate: string,
  parsed: PhoneNumber | undefined,
  selected?: CountryCode,
): PhoneIssue {
  const length = validatePhoneNumberLength(
    candidate,
    candidate.startsWith("+") ? undefined : selected,
  );
  if (length === "TOO_SHORT" || length === "TOO_LONG") return length;
  if (!parsed) return "INVALID";

  const country =
    (parsed.country as CountryCode | undefined) ??
    countryForCallingCode(parsed.countryCallingCode, selected);
  const example = country ? getExampleNumber(country, mobileExamples) : undefined;
  if (!example) return "INVALID";

  const national = parsed.nationalNumber;
  const expected = example.nationalNumber;
  if (national.length < expected.length) return "TOO_SHORT";
  if (national.length > expected.length) return "TOO_LONG";
  if (national[0] !== expected[0]) return "NOT_MOBILE";
  return "INVALID";
}

/**
 * The spec's processing order:
 * 1. strip spaces, brackets, hyphens and dots;
 * 2. a leading "+" is parsed as international;
 * 3. a leading "00" becomes "+" and is parsed as international;
 * 4. anything else is a national number of the selected country;
 * 5. if that is invalid but the digits start with the selected country's
 *    calling code ("44…" for GB), "+" is prepended and it is parsed again;
 * 6. the result must be valid and a mobile;
 * 7. it is returned as E.164.
 */
export function processPhone(raw: string | null | undefined, selectedCountry?: string | null): PhoneResult {
  const stripped = (raw ?? "").replace(/[\s().-]/g, "");
  if (!stripped) return { e164: null, country: null, issue: "EMPTY" };
  if (!/^\+?\d+$/.test(stripped)) return { e164: null, country: null, issue: "INVALID" };

  const selected = asCountry(selectedCountry);
  let candidate: string;
  let parsed: PhoneNumber | undefined;

  if (stripped.startsWith("+")) {
    candidate = stripped;
    parsed = parsePhoneNumberFromString(candidate);
  } else if (stripped.startsWith("00")) {
    candidate = `+${stripped.slice(2)}`;
    parsed = parsePhoneNumberFromString(candidate);
  } else {
    candidate = stripped;
    parsed = selected ? parsePhoneNumberFromString(candidate, selected) : undefined;
    if (!parsed?.isValid() && selected && stripped.startsWith(getCountryCallingCode(selected))) {
      const retried = parsePhoneNumberFromString(`+${stripped}`);
      if (retried?.isValid()) {
        candidate = `+${stripped}`;
        parsed = retried;
      }
    }
  }

  const country = (parsed?.country as string | undefined) ?? null;
  if (!parsed?.isValid()) {
    return { e164: null, country, issue: classifyInvalid(candidate, parsed, selected) };
  }
  if (!MOBILE_TYPES.has(parsed.getType() ?? "")) {
    return { e164: null, country, issue: "NOT_MOBILE" };
  }
  return { e164: parsed.number, country };
}

/** True for a valid mobile number (international, or national for `country`). */
export const isValidPhone = (value: unknown, country?: string | null): boolean =>
  typeof value === "string" && processPhone(value, country).e164 !== null;

/**
 * E.164 for a valid mobile; null for a blank value (which clears the field —
 * stored as NULL, never "", so the planned E.164 CHECK constraint holds). A
 * value that does not process is returned trimmed rather than dropped: the
 * validators make that unreachable, and losing data would be worse than
 * keeping it unformatted.
 */
export function normalizePhone(
  value: string | null | undefined,
  country?: string | null,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return processPhone(trimmed, country).e164 ?? trimmed;
}

/**
 * The columns for writing a phone over `currentPhone`. A number that changes
 * loses its verification — a verified number stays verified only while it is
 * the same number — and one that does not change keeps it.
 */
export function phoneUpdate(
  value: string | null | undefined,
  currentPhone: string | null | undefined,
  country?: string | null,
): { phone: string | null; phone_country: string | null; phone_verified_at?: null } {
  const columns = phoneColumns(value, country);
  return columns.phone === (currentPhone ?? null) ? columns : { ...columns, phone_verified_at: null };
}

/**
 * The phone and its country, ready for the users row: both null when the
 * phone is cleared.
 */
export function phoneColumns(
  value: string | null | undefined,
  country?: string | null,
): { phone: string | null; phone_country: string | null } {
  const phone = normalizePhone(value, country);
  if (!phone) return { phone: null, phone_country: null };
  const processed = processPhone(phone, country);
  return { phone, phone_country: processed.country };
}
