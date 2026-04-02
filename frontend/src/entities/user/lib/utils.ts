import { User, UpdateUserData } from '../model/types';

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

  // Derive first/last from full_name only as a last resort
  const splitFullName = (full?: string | null) => {
    if (!full) return { first: "", last: "" };
    const parts = full.trim().split(" ");
    const [first, ...rest] = parts;
    return { first, last: rest.join(" ") };
  };

  const nameFallback = splitFullName(currentUser.full_name);

  return {
    first_name:   currentUser.first_name   || nameFallback.first || "",
    last_name:    currentUser.last_name    || nameFallback.last  || "",
    address:      currentUser.address      || "",
    email:        currentUser.email        || "",
    phone:        currentUser.phone        || "",
    date_of_birth: dateOfBirth,
    nationality:  currentUser.nationality  || "",
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
