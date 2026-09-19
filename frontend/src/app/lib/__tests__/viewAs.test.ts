import { describe, expect, it } from "vitest";

import { resolveViewAsTenantId, withViewAs } from "../viewAs";

const TENANT = "11111111-1111-4111-8111-111111111111";

describe("resolveViewAsTenantId", () => {
  it("honours a UUID for an admin", () => {
    expect(resolveViewAsTenantId(TENANT, "admin")).toBe(TENANT);
  });

  it.each(["tenant", "operator", null, undefined])(
    "ignores the parameter for role %s — the backend would 403 it",
    (role) => {
      expect(resolveViewAsTenantId(TENANT, role)).toBeNull();
    },
  );

  it("ignores anything that is not a UUID", () => {
    expect(resolveViewAsTenantId("not-a-uuid", "admin")).toBeNull();
    expect(resolveViewAsTenantId("", "admin")).toBeNull();
    expect(resolveViewAsTenantId(null, "admin")).toBeNull();
  });

  it("tolerates stray whitespace around a pasted id", () => {
    expect(resolveViewAsTenantId(`  ${TENANT} `, "admin")).toBe(TENANT);
  });
});

describe("withViewAs", () => {
  it("appends the lens to a bare path", () => {
    expect(withViewAs("/app/properties/p-1", TENANT)).toBe(
      `/app/properties/p-1?viewAs=${TENANT}`,
    );
  });

  it("joins an existing query string with &", () => {
    expect(withViewAs("/app/units?page=2", TENANT)).toBe(
      `/app/units?page=2&viewAs=${TENANT}`,
    );
  });

  it("leaves the path alone when there is no tenant to view as", () => {
    expect(withViewAs("/app/properties/p-1", null)).toBe(
      "/app/properties/p-1",
    );
  });
});
