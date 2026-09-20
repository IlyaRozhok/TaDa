/**
 * The admin "view as tenant" lens: an admin opens `/app/units?viewAs={id}`
 * and sees the catalogue scored against that tenant's preferences.
 *
 * Read-only and admin-only. Nothing here logs the admin in as the tenant: the
 * id travels as `asUserId` on the matching reads, and the backend answers 403
 * for any caller who is not an admin and 404 for any id that is not a tenant.
 * These helpers only keep the client from sending what the server would
 * refuse anyway.
 */

/** The query parameter that carries the tenant id between pages. */
export const VIEW_AS_PARAM = "viewAs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The tenant id to view as, or `null`.
 *
 * Honoured only for an admin — for anyone else the parameter is ignored
 * client-side, since the backend would 403 it — and only when it is a UUID,
 * which is all the backend's `ParseUUIDPipe` accepts.
 */
export function resolveViewAsTenantId(
  rawParam: string | null | undefined,
  role: string | null | undefined,
): string | null {
  if (role !== "admin" || !rawParam) return null;
  const candidate = rawParam.trim();
  return UUID_PATTERN.test(candidate) ? candidate : null;
}

/**
 * `path` carrying the lens along, so a click from a view-as feed lands on a
 * view-as detail page. Unchanged when there is no tenant to view as.
 */
export function withViewAs(path: string, tenantId: string | null): string {
  if (!tenantId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${VIEW_AS_PARAM}=${encodeURIComponent(tenantId)}`;
}
