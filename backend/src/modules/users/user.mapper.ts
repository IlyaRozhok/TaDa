import { User } from "../../entities/user.entity";

export const toUserResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  full_name: user.full_name,
  avatar_url: user.avatar_url,
  provider: user.provider,
  google_id: user.google_id,
  email_verified: user.email_verified,
  created_at: user.created_at,
  updated_at: user.updated_at,
});
