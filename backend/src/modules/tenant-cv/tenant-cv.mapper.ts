import { Preferences } from "../../entities/preferences.entity";
import { TenantCv } from "../../entities/tenant-cv.entity";
import { User } from "../../entities/user.entity";
import { TenantCvResponseDto } from "./dto/tenant-cv-response.dto";

const splitName = (
  full?: string | null
): { first: string | null; last: string | null } => {
  if (!full) return { first: null, last: null };
  const parts = full.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return { first: null, last: null };
  const [first, ...rest] = parts;
  return { first: first || null, last: rest.join(" ") || null };
};

const calculateAge = (date: Date): number | null => {
  if (!date || isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const resolveAge = (dateOfBirth?: Date | string | null): number | null => {
  if (!dateOfBirth) return null;
  const asDate =
    dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth as any);
  return calculateAge(asDate);
};

export const buildTenantCvResponse = (
  user: User,
  cv?: TenantCv | null
): TenantCvResponseDto => {
  const preferences = user.preferences as Preferences | undefined;
  const tenantProfile = user.tenantProfile;

  const ageYears = resolveAge(tenantProfile?.date_of_birth);

  const nameFromTp = splitName(tenantProfile?.full_name);
  const nameFromUser = splitName(user.full_name || null);

  const first_name =
    tenantProfile?.first_name || nameFromTp.first || nameFromUser.first || null;
  const last_name =
    tenantProfile?.last_name || nameFromTp.last || nameFromUser.last || null;

  const profile = {
    first_name,
    last_name,
    full_name:
      [first_name, last_name].filter(Boolean).join(" ") ||
      tenantProfile?.full_name ||
      user.full_name ||
      null,
    avatar_url: user.avatar_url || null,
    email: user.email || null,
    phone: user.phone || null,
    age_years: ageYears,
    nationality: tenantProfile?.nationality || null,
    occupation: tenantProfile?.occupation || null,
    address: tenantProfile?.address || null,
  };

  const meta = {
    headline: cv?.headline || null,
    // Prefer preferences over tenant_cvs for kyc/referencing (with fallback for backward compatibility)
    kyc_status: preferences?.kyc_status || cv?.kyc_status || null,
    referencing_status: preferences?.referencing_status || cv?.referencing_status || null,
    move_in_date: preferences?.move_in_date
      ? new Date(preferences.move_in_date as any).toISOString()
      : null,
    move_out_date: preferences?.move_out_date
      ? new Date(preferences.move_out_date as any).toISOString()
      : null,
    created_at: user.created_at ? user.created_at.toISOString() : null,
    smoker: preferences?.smoker || null,
    pets: preferences?.pets
      ? preferences.pets
          .map((p) => (p.size ? `${p.type} (${p.size})` : p.type))
          .join(", ")
      : null,
    tenant_type_labels: preferences?.tenant_types || [],
  };

  const about =
    cv?.about_me ||
    preferences?.additional_info ||
    tenantProfile?.additional_info ||
    null;

  const hobbies =
    cv?.hobbies ?? preferences?.hobbies ?? tenantProfile?.hobbies ?? [];

  return {
    user_id: user.id,
    share_uuid: cv?.share_uuid || null,
    profile,
    meta,
    preferences: preferences || null,
    amenities: preferences?.amenities || [],
    about,
    hobbies,
    rent_history: cv?.rent_history || [],
  };
};
