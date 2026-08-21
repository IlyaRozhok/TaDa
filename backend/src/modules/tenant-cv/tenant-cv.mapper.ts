import { Preferences } from "../../entities/preferences.entity";
import { TenantCv } from "../../entities/tenant-cv.entity";
import { User } from "../../entities/user.entity";
import { TenantCvResponseDto } from "./dto/tenant-cv-response.dto";

const splitName = (
  full?: string | null,
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

/** "j•••@example.com" — enough to recognise your own address, useless to harvest. */
const maskEmail = (email: string): string => {
  const at = email.indexOf("@");
  if (at <= 0) return "•••";
  return `${email[0]}•••${email.slice(at)}`;
};

/** Keeps the last three digits: "••• ••• •890". */
const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  return `••• ••• •${digits.slice(-3) || "•••"}`;
};

export const buildTenantCvResponse = (
  user: User,
  cv?: TenantCv | null,
  options: { maskContacts?: boolean } = {},
): TenantCvResponseDto => {
  const preferences = user.preferences as Preferences | undefined;
  const tenantProfile = user.tenantProfile;

  const ageYears = resolveAge(user.date_of_birth);

  const nameFromUser = splitName(user.full_name || null);

  const first_name = user.first_name || nameFromUser.first || null;
  const last_name = user.last_name || nameFromUser.last || null;

  const profile = {
    first_name,
    last_name,
    full_name:
      [first_name, last_name].filter(Boolean).join(" ") ||
      user.full_name ||
      null,
    avatar_url: user.avatar_url || null,
    // Anonymous share-link viewers get masked contacts and no home address:
    // the link's purpose survives (an operator can recognise the person and
    // sign in for the rest), a leaked link no longer leaks a phone number.
    email: user.email
      ? options.maskContacts
        ? maskEmail(user.email)
        : user.email
      : null,
    phone: user.phone
      ? options.maskContacts
        ? maskPhone(user.phone)
        : user.phone
      : null,
    age_years: ageYears,
    nationality: user.nationality || null,
    occupation: tenantProfile?.occupation || null,
    address: options.maskContacts ? null : user.address || null,
    contacts_masked: Boolean(options.maskContacts),
  };

  const meta = {
    headline: cv?.headline || null,
    // Prefer preferences over tenant_cvs for kyc/referencing (with fallback for backward compatibility)
    kyc_status: cv?.kyc_status || null,
    referencing_status: cv?.referencing_status || null,
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

  // Strip user relation from preferences to avoid circular ref on JSON serialize (500 for admin/operator)
  const preferencesPayload =
    preferences && typeof preferences === "object"
      ? (() => {
          const { user: _user, ...rest } = preferences as Preferences & {
            user?: unknown;
          };
          return rest;
        })()
      : null;

  return {
    user_id: user.id,
    share_uuid: cv?.share_uuid || null,
    profile,
    meta,
    preferences: preferencesPayload,
    amenities: preferences?.amenities || [],
    about,
    hobbies,
    rent_history: cv?.rent_history || [],
  };
};
