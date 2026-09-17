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
};

/**
 * A row of the admin users list. Kept apart from `toUserResponse` because only
 * the list query joins the CV: stamping the field onto every user response
 * would answer `null` from endpoints that never loaded it, which reads as "no
 * share link" when it means "not looked up".
 */
export const toAdminUserListItem = (user: User): AdminUserListItem => ({
  ...toUserResponse(user),
  tenant_cv_share_uuid: user.tenantCv?.share_uuid ?? null,
});
