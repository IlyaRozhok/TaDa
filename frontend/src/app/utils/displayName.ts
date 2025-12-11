export interface HasNameFields {
  tenantProfile?: {
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
  } | null;
  full_name?: string | null;
  email?: string | null;
}

export const buildDisplayName = (entity?: HasNameFields | null): string => {
  if (!entity) return "User";

  const first = entity.tenantProfile?.first_name?.trim();
  const last = entity.tenantProfile?.last_name?.trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  const tpFull = entity.tenantProfile?.full_name?.trim();
  if (tpFull) return tpFull;

  const full = entity.full_name?.trim();
  if (full) return full;

  if (entity.email) {
    return entity.email.split("@")[0] || entity.email;
  }

  return "User";
};

export const buildInitials = (
  displayName: string,
  email?: string | null
): string => {
  const parts = displayName
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  if (email) {
    return (email[0] || "U").toUpperCase();
  }

  return "U";
};
