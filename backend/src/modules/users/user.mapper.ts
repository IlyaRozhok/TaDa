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
  phone:
    (user as any).phone ||
    (user as any).tenantProfile?.phone ||
    (user as any).operatorProfile?.phone ||
    null,
  provider: user.provider,
  google_id: user.google_id,
  email_verified: user.email_verified,
  created_at: user.created_at,
  updated_at: user.updated_at,
  is_private_landlord:
    (user as any).operatorProfile?.is_private_landlord ?? null,
});
