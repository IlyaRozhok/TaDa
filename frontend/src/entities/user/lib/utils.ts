import { User, UpdateUserData } from '../model/types';

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
      occupation: "",
      avatar_url: "",
    };
  }

  const splitFullName = (full?: string | null) => {
    if (!full) return { first: "", last: "" };
    const parts = full.trim().split(" ");
    if (parts.length === 1) return { first: parts[0], last: "" };
    const [first, ...rest] = parts;
    return { first, last: rest.join(" ") };
  };

  const profile = currentUser?.role === "tenant"
    ? currentUser.tenantProfile
    : currentUser.operatorProfile;

  const nameFallback = splitFullName(
    profile?.full_name || currentUser.full_name
  );

  let formattedDateOfBirth = "";
  const dateOfBirth = profile?.date_of_birth;
  if (dateOfBirth) {
    try {
      const date = new Date(dateOfBirth);
      if (!isNaN(date.getTime())) {
        formattedDateOfBirth = date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.warn("Error formatting date_of_birth:", error);
    }
  }

  return {
    first_name: profile?.first_name || nameFallback.first || "",
    last_name: profile?.last_name || nameFallback.last || "",
    address: profile?.address || "",
    email: currentUser.email || "",
    phone: profile?.phone || "",
    date_of_birth: formattedDateOfBirth,
    nationality: profile?.nationality || "",
    occupation: profile?.occupation || "",
    avatar_url: profile?.avatar_url || currentUser.avatar_url || profile?.photo_url || "",
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
