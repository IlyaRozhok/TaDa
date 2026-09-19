import { User } from "../../entities/user.entity";

export type UserResponse = {
  id: string;
  email: string;
  role: User["role"];
  status: User["status"];
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  provider: string | null;
  google_id: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  is_private_landlord?: boolean | null;
};

export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  full_name: user.full_name,
  avatar_url: user.avatar_url,
  phone: user.phone || null,
  provider: user.provider,
  google_id: user.google_id,
  email_verified: user.email_verified,
  created_at: user.created_at,
  updated_at: user.updated_at,
  is_private_landlord:
    (user as any).operatorProfile?.is_private_landlord ?? null,
});

export type AdminUserListItem = UserResponse & {
  /**
   * `tenant_cvs.share_uuid` — the token behind the public `/cv/{uuid}` page.
   * Null when the user has no CV or has never created a share link: the
   * token is minted on first share, not with the CV.
   */
  tenant_cv_share_uuid: string | null;
  /**
   * Whether the user has a preferences row. The admin "View as" action needs
   * it: the lens scores against a tenant's preferences, and without any it
   * would open an unranked feed with every badge at 0%.
   */
  has_preferences: boolean;
};

/**
 * A row of the admin users list. Kept apart from `toUserResponse` because only
 * the list query joins the CV and preferences: stamping these fields onto
 * every user response would answer `null`/`false` from endpoints that never
 * loaded them, which reads as "no share link" or "no preferences" when it
 * means "not looked up".
 */
export const toAdminUserListItem = (user: User): AdminUserListItem => ({
  ...toUserResponse(user),
  tenant_cv_share_uuid: user.tenantCv?.share_uuid ?? null,
  // The list query already left-joins preferences; no extra lookup.
  has_preferences: Boolean(user.preferences),
});
