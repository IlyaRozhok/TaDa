import { User, UpdateUserData } from '@/types/user';

/**
 * Map a User object (from Redux / API) to the flat UpdateUserData shape
 * used by the profile form.
 *
 * Personal fields (first_name, last_name, address, phone, date_of_birth,
 * nationality) now live directly on the users table and are returned at the
 * top level of the user object.  We no longer need to dig into tenantProfile /
 * operatorProfile for them.
 */
export const buildFormDataFromUser = (currentUser: User | null): UpdateUserData => {
  if (!currentUser) {
    return {
      first_name: "",
      last_name: "",
      address: "",
      email: "",
      phone: "",
      date_of_birth: "",
      nationality: "",
      avatar_url: "",
    };
  }

  // Normalize date_of_birth to YYYY-MM-DD string
  let dateOfBirth = "";
  const raw = currentUser.date_of_birth;
  if (raw) {
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        dateOfBirth = d.toISOString().split("T")[0];
      }
    } catch {
      // ignore
    }
  }

  // Normalize text fields to avoid showing literal "undefined" in inputs.
  const normalizeText = (value?: string | null): string => {
    if (!value) return "";
    const trimmedValue = value.trim();
    if (trimmedValue.toLowerCase() === "undefined") return "";
    return trimmedValue;
  };

  // Derive first name from full_name as a last resort.
  // Last name should not be prefilled from full_name.
  const splitFullName = (full?: string | null) => {
    if (!full) return { first: "", last: "" };
    const parts = full.trim().split(" ");
    const [first, ...rest] = parts;
    return { first, last: rest.join(" ") };
  };

  const nameFallback = splitFullName(currentUser.full_name);

  return {
    first_name: normalizeText(currentUser.first_name) || nameFallback.first || "",
    last_name: normalizeText(currentUser.last_name),
    address: normalizeText(currentUser.address),
    email: normalizeText(currentUser.email),
    phone: normalizeText(currentUser.phone),
    date_of_birth: dateOfBirth,
    nationality: normalizeText(currentUser.nationality),
    // Avatar can live either in top-level `users.avatar_url` or in the nested
    // role profiles (legacy/backward-compat responses).
    avatar_url:
      currentUser.avatar_url ||
      currentUser.tenantProfile?.avatar_url ||
      currentUser.operatorProfile?.avatar_url ||
      "",
  };
};

export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
};
