import { FindOptionsWhere, IsNull } from "typeorm";
import { Property } from "@/entities/property.entity";

/**
 * Effective visibility, derived at read time and never written anywhere: a
 * property is publicly visible only if its own flag is on AND it has no
 * building or its building's flag is on. Hiding a building therefore hides its
 * properties instantly, and restoring it brings back exactly the ones that are
 * individually visible.
 *
 * Applies to discovery (catalogue, matching, landing, public detail). Admin and
 * operator management views and existing bookings/shortlists do not use it.
 */

/**
 * Emitted, synchronously, after a write that can change what is publicly
 * visible. The matching feed drops its cached rankings on it: a cached `total`
 * would otherwise keep counting rows the page no longer returns.
 */
export const CATALOGUE_VISIBILITY_CHANGED = "catalogue.visibility-changed";

/**
 * The rule for a query builder whose main alias is `property`. NOT EXISTS, not
 * a join on `building`: it holds whether or not the query joins the building
 * (the ranking pass only does when searching) and cannot multiply rows.
 */
export const PUBLICLY_VISIBLE_SQL =
  "(property.is_visible = true AND NOT EXISTS (" +
  "SELECT 1 FROM buildings visibility_building " +
  "WHERE visibility_building.id = property.building_id AND visibility_building.is_visible = false" +
  "))";

/** The same rule for `find`/`findOne` options: no building, or a visible one. */
export function publiclyVisibleWhere(
  where: FindOptionsWhere<Property>,
): FindOptionsWhere<Property>[] {
  return [
    { ...where, is_visible: true, building_id: IsNull() },
    { ...where, is_visible: true, building: { is_visible: true } },
  ];
}

/** The same rule for a loaded entity; the `building` relation must be loaded. */
export function isPubliclyVisible(
  property: Pick<Property, "is_visible" | "building">,
): boolean {
  return property.is_visible !== false && property.building?.is_visible !== false;
}
