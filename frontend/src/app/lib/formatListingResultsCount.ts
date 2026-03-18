/** Localazy `listing.property.results.description`: `{number}` / `{{number}}`, or suffix without placeholder → `• count …`. */
export function formatListingResultsCountLabel(
  template: string,
  count: number,
): string {
  const n = String(count);
  const hasPlaceholder = /\{\{number\}\}|\{number\}/.test(template);
  if (hasPlaceholder) {
    const filled = template
      .replace(/\{\{number\}\}/g, n)
      .replace(/\{number\}/g, n)
      .trim();
    return filled.startsWith("•") ? filled : `• ${filled}`;
  }
  const suffix = template.trim();
  return suffix ? `• ${n} ${suffix}` : `• ${n}`;
}
