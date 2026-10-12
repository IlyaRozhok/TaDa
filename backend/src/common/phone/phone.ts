import {
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";

/**
 * Server-side phone normalisation. Every phone written through the API is
 * stored in E.164 (`+447041230790`), whatever formatting the client sent:
 * the DTO decorators reject anything that is not a valid number first, so by
 * the time a value reaches `normalizePhone` it parses.
 *
 * "max" metadata, the set class-validator's `@IsPhoneNumber` uses, so this
 * and the decorators never disagree about a number.
 *
 * Existing rows are not touched — legacy values such as "+447041 230790" stay
 * readable as they are, and are only rewritten when the user saves a phone.
 */

const asCountry = (country?: string | null): CountryCode | undefined => {
  const upper = country?.toUpperCase();
  return upper && isSupportedCountry(upper) ? (upper as CountryCode) : undefined;
};

/** True when `value` is a valid number (international, or national for `country`). */
export function isValidPhone(value: unknown, country?: string | null): boolean {
  if (typeof value !== "string" || !/\d/.test(value)) return false;
  return parsePhoneNumberFromString(value, asCountry(country))?.isValid() ?? false;
}

/**
 * E.164 for a valid number; null for a blank one (which clears the field).
 * A value that does not parse is returned trimmed rather than dropped — the
 * validators make that unreachable, and losing data would be worse than
 * keeping it unformatted.
 */
export function normalizePhone(
  value: string | null | undefined,
  country?: string | null,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, asCountry(country));
  return parsed?.isValid() ? parsed.number : trimmed;
}
