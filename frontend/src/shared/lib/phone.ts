import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js/max";
import mobileExamples from "libphonenumber-js/mobile/examples";

/**
 * Phone handling for every form that takes a number, mirrored in the
 * backend's `common/phone/phone.ts` (the apps share no package) — same rules,
 * same order, same test tables. libphonenumber-js carries the per-country
 * numbering plans, so nothing here hard-codes a length or truncates.
 *
 * The "max" metadata on purpose: the smaller default set disagrees on some
 * numbers (it accepts Israeli mobiles the full set rejects), and the form
 * must never pass a number the API then refuses.
 *
 * Only mobiles are accepted. `FIXED_LINE_OR_MOBILE` counts as mobile: the
 * North American plan cannot tell the two apart, so rejecting it would
 * reject every US, Canadian and Mexican number.
 *
 * `country` is an ISO 3166-1 alpha-2 code from `countries.ts`.
 */

export type PhoneIssue = "EMPTY" | "TOO_SHORT" | "TOO_LONG" | "NOT_MOBILE" | "INVALID";

export interface PhoneResult {
  /** E.164 (`+447123456789`) when the number is a valid mobile, else null. */
  e164: string | null;
  /** ISO country of the parsed number, when it could be determined. */
  country: string | null;
  issue?: PhoneIssue;
}

/** The spec's English messages, shown under the field once it loses focus. */
export const PHONE_ISSUE_MESSAGES: Record<Exclude<PhoneIssue, "EMPTY">, string> = {
  TOO_SHORT: "Number is too short — please check it",
  TOO_LONG: "Number is too long — please check it",
  NOT_MOBILE: "Please enter a mobile number",
  INVALID: "Please enter a valid phone number",
};

/** Shown for an empty field that is required. */
export const PHONE_REQUIRED_MESSAGE = "Please enter a phone number";

const MOBILE_TYPES = new Set(["MOBILE", "FIXED_LINE_OR_MOBILE"]);

const toCountry = (country?: string | null): CountryCode | undefined => {
  const upper = country?.toUpperCase();
  return upper && isSupportedCountry(upper) ? (upper as CountryCode) : undefined;
};

/** Step 1: spaces, brackets, hyphens and dots go. */
const stripPhone = (input: string): string => input.replace(/[\s().-]/g, "");

/** True when the field holds at least one digit. */
export const hasPhoneDigits = (input: string | null | undefined): boolean =>
  /\d/.test(input ?? "");

function countryForCallingCode(code: string, selected?: CountryCode): CountryCode | undefined {
  if (selected && getCountryCallingCode(selected) === code) return selected;
  return getCountries().find((c) => getCountryCallingCode(c) === code);
}

/**
 * Why an invalid number fails: the library's length check first, then the
 * national number measured against the country's example mobile (a GB
 * "0712345678" is a possible length for some UK number, but a digit short of
 * any mobile), and a leading digit no mobile has ("01632 960123") reads as
 * not mobile.
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
export function processPhone(
  raw: string | null | undefined,
  selectedCountry?: string | null,
): PhoneResult {
  const stripped = stripPhone(raw ?? "");
  if (!stripped) return { e164: null, country: null, issue: "EMPTY" };
  if (!/^\+?\d+$/.test(stripped)) return { e164: null, country: null, issue: "INVALID" };

  const selected = toCountry(selectedCountry);
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

/** The number in E.164, or null unless it is a valid mobile. */
export const toE164 = (input: string | null | undefined, country: string): string | null =>
  processPhone(input, country).e164;

/** Whether the input is a complete, valid mobile number. */
export const isValidPhone = (input: string | null | undefined, country: string): boolean =>
  toE164(input, country) !== null;

/** Why a non-empty number fails; undefined for an empty or valid one. */
export function phoneIssue(
  input: string | null | undefined,
  country: string,
): Exclude<PhoneIssue, "EMPTY"> | undefined {
  const { issue } = processPhone(input, country);
  return issue === "EMPTY" ? undefined : issue;
}

/**
 * The inline error for the field, or undefined when there is none. An empty
 * field is an error only when the phone is required.
 */
export function phoneErrorMessage(
  input: string | null | undefined,
  country: string,
  { required = false }: { required?: boolean } = {},
): string | undefined {
  const issue = phoneValidationIssue(input, country, { required });
  if (!issue) return undefined;
  return issue === "EMPTY" ? PHONE_REQUIRED_MESSAGE : PHONE_ISSUE_MESSAGES[issue];
}

/**
 * The field's problem, if any: like `processPhone`, but an empty field is a
 * problem only when the phone is required. For callers that turn the issue
 * into their own (translated) text.
 */
export function phoneValidationIssue(
  input: string | null | undefined,
  country: string,
  { required = false }: { required?: boolean } = {},
): PhoneIssue | undefined {
  const { issue } = processPhone(input, country);
  if (issue === "EMPTY" && !required) return undefined;
  return issue;
}

/**
 * Formats a number as it is being typed, in the selected country's style
 * (or its own country's, once typed with "+" or "00"). It never drops a
 * digit: past the plan's maximum the digits stay, unformatted, and
 * validation reports the number as too long instead.
 */
export function formatPhoneInput(input: string, country: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed.startsWith("+") ? "+" : "";
  const international = trimmed.startsWith("+") || digits.startsWith("00");
  const clean = trimmed.startsWith("+") ? `+${digits}` : digits.startsWith("00") ? `+${digits.slice(2)}` : digits;
  return new AsYouType(international ? undefined : toCountry(country)).input(clean);
}

/**
 * The country an internationally typed number belongs to ("+33 6…" → FR,
 * "0044 7…" → GB), so the selector can follow it. Undefined for national
 * input, or while the digits do not yet identify a country.
 */
export function detectPhoneCountry(input: string): string | undefined {
  const stripped = stripPhone(input.trim());
  const international = stripped.startsWith("+")
    ? stripped
    : stripped.startsWith("00")
      ? `+${stripped.slice(2)}`
      : null;
  if (!international) return undefined;
  const parsed = parsePhoneNumberFromString(international);
  if (parsed?.country) return parsed.country;
  const typing = new AsYouType();
  typing.input(international);
  return typing.getCountry();
}

/**
 * Splits a valid stored number into its country and the national number the
 * input shows (`+447400883369` → GB, `07400 883369`). Null when the stored
 * value is not a valid international number — legacy rows are then split by
 * `parseStoredPhone`'s dial-code match instead.
 */
export function splitValidPhone(
  stored: string | null | undefined,
): { country: string; national: string } | null {
  if (!hasPhoneDigits(stored)) return null;
  const parsed = parsePhoneNumberFromString(stripPhone((stored as string).trim()));
  if (!parsed?.isValid() || !parsed.country) return null;
  return { country: parsed.country, national: parsed.formatNational() };
}

/**
 * A stored value parsed for display. `country` reads a legacy national value
 * (call requests kept "20 7946 0000" beside a separate country code); E.164
 * ignores it.
 */
const parseStored = (
  stored: string | null | undefined,
  country?: string | null,
): PhoneNumber | undefined => {
  if (!hasPhoneDigits(stored)) return undefined;
  const parsed = parsePhoneNumberFromString(stripPhone((stored as string).trim()), toCountry(country));
  return parsed?.isValid() ? parsed : undefined;
};

/**
 * A stored number as staff should read it: UK numbers nationally
 * ("07400 883369"), everything else internationally ("+33 6 12 34 56 78").
 * A value that does not parse (legacy rows) is shown as stored.
 */
export function formatPhoneForDisplay(
  stored: string | null | undefined,
  country?: string | null,
): string {
  const parsed = parseStored(stored, country);
  if (!parsed) return (stored ?? "").trim();
  return parsed.country === "GB" ? parsed.formatNational() : parsed.formatInternational();
}

/**
 * `tel:` and WhatsApp links for a stored number, or null when it is not a
 * valid number — a link to a truncated legacy value would dial a stranger.
 */
export function phoneLinks(
  stored: string | null | undefined,
  country?: string | null,
): { tel: string; whatsapp: string } | null {
  const parsed = parseStored(stored, country);
  if (!parsed) return null;
  return {
    tel: `tel:${parsed.number}`,
    whatsapp: `https://wa.me/${parsed.number.slice(1)}`,
  };
}
