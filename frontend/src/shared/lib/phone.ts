import {
  AsYouType,
  isSupportedCountry,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js/max";

/**
 * Phone handling for every form that takes a number. libphonenumber-js
 * carries the per-country numbering plans, so nothing here hard-codes a
 * length: a UK number typed with its trunk "0" (07041 230790) and the same
 * number typed internationally (+44 7041 230790) both come out as
 * +447041230790, and no country's number is cut short by a fixed mask.
 *
 * The "max" metadata on purpose: it is what the backend's `@IsPhoneNumber`
 * validates with, and the smaller default set disagrees on some numbers
 * (it accepts Israeli mobiles the full set rejects) — the form must never
 * pass a number the API then refuses.
 *
 * `country` is an ISO 3166-1 alpha-2 code from `countries.ts`.
 */

const toCountry = (country: string): CountryCode | undefined => {
  const upper = country.toUpperCase();
  return isSupportedCountry(upper) ? (upper as CountryCode) : undefined;
};

/** Digits and one leading "+": everything else a user might paste is noise. */
const sanitize = (input: string): string => {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
};

/** True when the field holds at least one digit. */
export const hasPhoneDigits = (input: string | null | undefined): boolean =>
  /\d/.test(input ?? "");

/**
 * Formats a number as it is being typed, in the selected country's style.
 * It never drops a digit: past the plan's maximum the digits stay, unformatted,
 * and validation reports the number as too long instead.
 */
export function formatPhoneInput(input: string, country: string): string {
  const clean = sanitize(input);
  if (!clean) return "";
  return new AsYouType(toCountry(country)).input(clean);
}

/** The number in E.164 (`+447041230790`), or null unless it is valid. */
export function toE164(input: string | null | undefined, country: string): string | null {
  if (!hasPhoneDigits(input)) return null;
  const parsed = parsePhoneNumberFromString(sanitize(input as string), toCountry(country));
  return parsed?.isValid() ? parsed.number : null;
}

/** Whether the input is a complete, valid number for the country. */
export const isValidPhone = (input: string | null | undefined, country: string): boolean =>
  toE164(input, country) !== null;

export type PhoneLengthIssue = "TOO_SHORT" | "TOO_LONG" | "INVALID_LENGTH" | "INVALID";

/**
 * Why a non-empty number fails, for a precise error message: a length
 * problem when the plan says so, otherwise a plain "INVALID". Undefined for
 * an empty or valid number.
 */
export function phoneIssue(
  input: string | null | undefined,
  country: string,
): PhoneLengthIssue | undefined {
  if (!hasPhoneDigits(input) || isValidPhone(input, country)) return undefined;
  const length = validatePhoneNumberLength(sanitize(input as string), toCountry(country));
  if (length === "TOO_SHORT" || length === "TOO_LONG" || length === "INVALID_LENGTH") {
    return length;
  }
  return "INVALID";
}

/**
 * Splits a valid stored number into its country and the national number the
 * input shows (`+447041230790` → GB, `07041 230790`). Null when the stored
 * value is not a valid international number — legacy rows are then split by
 * `parseStoredPhone`'s dial-code match instead.
 */
export function splitValidPhone(
  stored: string | null | undefined,
): { country: string; national: string } | null {
  if (!hasPhoneDigits(stored)) return null;
  const parsed = parsePhoneNumberFromString(sanitize(stored as string));
  if (!parsed?.isValid() || !parsed.country) return null;
  return { country: parsed.country, national: parsed.formatNational() };
}
