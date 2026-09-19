import { toAdminUserListItem, toUserResponse } from "./user.mapper";
import { User, UserRole, UserStatus } from "../../entities/user.entity";

/**
 * Characterization tests for toUserResponse.
 *
 * These pin the CURRENT observable behaviour before the Users/Profiles schema
 * consolidation. They are intentionally exact: if the consolidation changes
 * where a field is sourced from (e.g. phone moving to a single canonical
 * column), these tests must be updated deliberately, not by accident.
 */
describe("toUserResponse (characterization)", () => {
  const baseUser = (): User =>
    ({
      id: "u-1",
      email: "user@example.com",
      role: UserRole.Tenant,
      status: UserStatus.Active,
      full_name: "John Doe",
      avatar_url: "https://cdn/avatar.jpg",
      phone: "+44 100",
      provider: "google",
      google_id: "g-1",
      email_verified: true,
      created_at: new Date("2024-01-01T00:00:00Z"),
      updated_at: new Date("2024-01-02T00:00:00Z"),
    }) as User;

  it("maps the canonical top-level user fields", () => {
    const result = toUserResponse(baseUser());

    expect(result).toEqual({
      id: "u-1",
      email: "user@example.com",
      role: UserRole.Tenant,
      status: UserStatus.Active,
      full_name: "John Doe",
      avatar_url: "https://cdn/avatar.jpg",
      phone: "+44 100",
      provider: "google",
      google_id: "g-1",
      email_verified: true,
      created_at: new Date("2024-01-01T00:00:00Z"),
      updated_at: new Date("2024-01-02T00:00:00Z"),
      is_private_landlord: null,
    });
  });

  it("does NOT expose PII fields (address, date_of_birth, nationality, names)", () => {
    const user = {
      ...baseUser(),
      address: "123 Secret St",
      date_of_birth: new Date("1990-01-15"),
      nationality: "British",
      first_name: "John",
      last_name: "Doe",
      password: "hash",
    } as unknown as User;

    const result = toUserResponse(user) as Record<string, unknown>;

    expect(result).not.toHaveProperty("address");
    expect(result).not.toHaveProperty("date_of_birth");
    expect(result).not.toHaveProperty("nationality");
    expect(result).not.toHaveProperty("first_name");
    expect(result).not.toHaveProperty("last_name");
    expect(result).not.toHaveProperty("password");
  });

  describe("phone (canonical on the user, post-consolidation)", () => {
    it("reads phone from the top-level user, ignoring profile phones", () => {
      const user = {
        ...baseUser(),
        phone: "+44 TOP",
        tenantProfile: { phone: "+44 TENANT" },
        operatorProfile: { phone: "+44 OPERATOR" },
      } as unknown as User;

      expect(toUserResponse(user).phone).toBe("+44 TOP");
    });

    it("returns null when user.phone is empty even if a profile has a phone", () => {
      const user = {
        ...baseUser(),
        phone: null,
        tenantProfile: { phone: "+44 TENANT" },
        operatorProfile: { phone: "+44 OPERATOR" },
      } as unknown as User;

      expect(toUserResponse(user).phone).toBeNull();
    });

    it("returns null when there is no phone on the user", () => {
      const user = { ...baseUser(), phone: null } as unknown as User;

      expect(toUserResponse(user).phone).toBeNull();
    });
  });

  describe("is_private_landlord", () => {
    it("reflects operatorProfile.is_private_landlord when present", () => {
      const user = {
        ...baseUser(),
        operatorProfile: { is_private_landlord: true },
      } as unknown as User;

      expect(toUserResponse(user).is_private_landlord).toBe(true);
    });

    it("is null when there is no operator profile", () => {
      expect(toUserResponse(baseUser()).is_private_landlord).toBeNull();
    });
  });
});

describe("toAdminUserListItem", () => {
  const user = (overrides: Record<string, unknown> = {}): User =>
    ({
      id: "u-1",
      email: "tenant@example.com",
      role: UserRole.Tenant,
      status: UserStatus.Active,
      created_at: new Date("2024-01-01T00:00:00Z"),
      updated_at: new Date("2024-01-02T00:00:00Z"),
      ...overrides,
    }) as unknown as User;

  it("carries the CV share token for the public CV link", () => {
    const result = toAdminUserListItem(
      user({ tenantCv: { id: "cv-1", share_uuid: "share-1" } }),
    );

    expect(result.tenant_cv_share_uuid).toBe("share-1");
  });

  it("is null for a CV that was never shared — the token is minted on first share", () => {
    const result = toAdminUserListItem(
      user({ tenantCv: { id: "cv-1", share_uuid: null } }),
    );

    expect(result.tenant_cv_share_uuid).toBeNull();
  });

  it("is null for a user with no CV at all", () => {
    expect(toAdminUserListItem(user()).tenant_cv_share_uuid).toBeNull();
  });

  it("keeps every field toUserResponse produces", () => {
    const u = user({ tenantCv: { id: "cv-1", share_uuid: "share-1" } });

    expect(toAdminUserListItem(u)).toEqual({
      ...toUserResponse(u),
      tenant_cv_share_uuid: "share-1",
      has_preferences: false,
    });
  });

  it("reports has_preferences from the joined preferences row", () => {
    expect(
      toAdminUserListItem(user({ preferences: { id: "p-1" } })).has_preferences,
    ).toBe(true);
  });

  it("reports no preferences when the join found none", () => {
    expect(toAdminUserListItem(user()).has_preferences).toBe(false);
  });
});
