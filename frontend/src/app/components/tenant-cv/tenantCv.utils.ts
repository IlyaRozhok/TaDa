export const formatCurrencyRange = (
  min?: number | null,
  max?: number | null
) => {
  if (!min && !max) return "Not set";
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(v);
  if (min && max) return `${fmt(min)}-${fmt(max)}`;
  return min ? `from ${fmt(min)}` : `up to ${fmt(max!)}`;
};

export const dateToDisplay = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const normalizeHobbies = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((h) => {
        if (typeof h === "string") return h.trim();
        if (h && typeof h === "object") {
          const obj = h as Record<string, unknown>;
          return (
            (typeof obj.label === "string" && obj.label) ||
            (typeof obj.name === "string" && obj.name) ||
            (typeof obj.value === "string" && obj.value) ||
            ""
          ).trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/[,;]+/)
      .map((h) => h.trim())
      .filter(Boolean);
  }
  return [];
};
