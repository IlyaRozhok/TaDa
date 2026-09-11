/**
 * Tenant Fees Act 2019 deposit cap, mirroring the backend's computation in
 * `property.response.ts`: 5 weeks' rent below £50,000 annual rent, 6 weeks at
 * or above, rounded to pence so a float artifact cannot flag a compliant
 * deposit. The admin routes return the raw entity without the computed flag,
 * so the property forms recompute it here to warn while the operator types.
 */
export function depositExceedsCap(
  price: number | null | undefined,
  deposit: number | null | undefined,
): boolean {
  if (price == null || price <= 0 || deposit == null) return false;
  const annualRent = price * 12;
  const weeklyRent = annualRent / 52;
  const capWeeks = annualRent >= 50000 ? 6 : 5;
  const cap = Math.round(weeklyRent * capWeeks * 100) / 100;
  return deposit > cap;
}

/** The cap itself in pounds, for showing "max £X" next to the warning. */
export function depositCapAmount(
  price: number | null | undefined,
): number | null {
  if (price == null || price <= 0) return null;
  const annualRent = price * 12;
  const weeklyRent = annualRent / 52;
  const capWeeks = annualRent >= 50000 ? 6 : 5;
  return Math.round(weeklyRent * capWeeks * 100) / 100;
}
