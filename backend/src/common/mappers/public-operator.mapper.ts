import { User } from "@/entities/user.entity";
import { Property } from "@/entities/property.entity";

/**
 * Tenant-facing reads (matching, shortlist) join `property.operator` and
 * `building.operator` and used to return the full User row — email, phone,
 * address, date_of_birth, google_id and the rest. ClassSerializerInterceptor
 * is applied on UsersController only, so nothing redacted it on these paths.
 * This projection keeps exactly what the frontend renders from an operator:
 * `id` and `full_name`.
 */
export function toPublicOperator(operator: User): Pick<User, "id" | "full_name"> {
  return {
    id: operator.id,
    full_name: operator.full_name,
  };
}

/**
 * Replace loaded operator relations on a property (and its building) with the
 * public projection. Mutates and returns the same instance — the callers hand
 * the entity straight to the response, never back to the ORM.
 */
export function stripOperatorPii(property: Property): Property {
  if (property.operator) {
    property.operator = toPublicOperator(property.operator) as User;
  }
  if (property.building?.operator) {
    property.building.operator = toPublicOperator(
      property.building.operator,
    ) as User;
  }
  return property;
}
