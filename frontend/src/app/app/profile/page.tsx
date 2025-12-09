"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  updateUser,
  setAuth,
} from "../../store/slices/authSlice";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import { StepWrapper } from "../../components/preferences/step-components/StepWrapper";
import { StepContainer } from "../../components/preferences/step-components/StepContainer";
import { InputField } from "../../components/preferences/ui/InputField";
import { GlassmorphismDatePicker } from "../../components/preferences/ui/GlassmorphismDatePicker";
import { GlassmorphismDropdown } from "../../components/preferences/ui/GlassmorphismDropdown";
import { authAPI } from "../../lib/api";

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
  avatar_url?: string;
}

const OCCUPATION_OPTIONS = [
  { value: "", label: "Select occupation" },
  { value: "full-time-employed", label: "Full-time employed" },
  { value: "part-time-employed", label: "Part-time employed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "student", label: "Student" },
  { value: "self-employed", label: "Self-employed" },
  { value: "retired", label: "Retired" },
];

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingFieldRef = useRef<{
    field: keyof UpdateUserData;
    value: unknown;
  } | null>(null);
  const initialFormDataRef = useRef<UpdateUserData | null>(null);

  const [formData, setFormData] = useState<UpdateUserData>({
    first_name: "",
    last_name: "",
    address: "",
    email: "",
    phone: "",
    date_of_birth: "",
    nationality: "",
    occupation: "",
    avatar_url: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Check auth token; only redirect if no token. If token exists but user not loaded, fetch profile.
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    if (!token) {
      router.replace("/app/auth/login");
      return;
    }

    if (!user && !loadingProfile) {
      setLoadingProfile(true);
      authAPI
        .getProfile()
        .then((res) => {
          const fetchedUser = res.data;
          dispatch(setAuth({ user: fetchedUser, accessToken: token }));
        })
        .catch((err) => {
          console.error("Failed to fetch profile:", err);
          router.replace("/app/auth/login");
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [user, router, dispatch, loadingProfile]);

  const buildFormDataFromUser = useCallback(
    (currentUser: any): UpdateUserData => {
      const splitFullName = (full?: string | null) => {
        if (!full) return { first: "", last: "" };
        const parts = full.trim().split(" ");
        if (parts.length === 1) return { first: parts[0], last: "" };
        const [first, ...rest] = parts;
        return { first, last: rest.join(" ") };
      };

      const profile =
        currentUser?.role === "tenant"
          ? currentUser.tenantProfile
          : currentUser.operatorProfile;

      const nameFallback = splitFullName(
        (profile as any)?.full_name || currentUser.full_name
      );

      let formattedDateOfBirth = "";
      const dateOfBirth = (profile as any)?.date_of_birth;
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
        first_name: (profile as any)?.first_name || nameFallback.first || "",
        last_name: (profile as any)?.last_name || nameFallback.last || "",
        address: (profile as any)?.address || "",
        email: currentUser.email || "",
        phone: profile?.phone || "",
        date_of_birth: formattedDateOfBirth,
        nationality: (profile as any)?.nationality || "",
        occupation: (profile as any)?.occupation || "",
        avatar_url:
          (profile as any)?.avatar_url ||
          currentUser.avatar_url ||
          (profile as any)?.photo_url ||
          "",
      };
    },
    []
  );

  useEffect(() => {
    if (user) {
      const initialData = buildFormDataFromUser(user);
      setFormData(initialData);
      initialFormDataRef.current = initialData;
    }
  }, [user, buildFormDataFromUser]);

  // Save single field to API
  const saveSingleField = useCallback(
    async (field: keyof UpdateUserData, value: unknown) => {
      if (!user) {
        return;
      }

      try {
        // Get current value from user/profile
        const profile =
          user.role === "tenant" ? user.tenantProfile : user.operatorProfile;
        let currentValue: unknown;

        if (field === "email") {
          currentValue = user[field];
        } else if (field === "date_of_birth") {
          const currentDate = (profile as any)?.date_of_birth;
          if (currentDate) {
            try {
              const date = new Date(currentDate);
              currentValue = !isNaN(date.getTime())
                ? date.toISOString().split("T")[0]
                : "";
            } catch {
              currentValue = "";
            }
          } else {
            currentValue = "";
          }
        } else {
          currentValue = (profile as any)?.[field];
        }

        // Check if value actually changed
        const hasChanged = value !== currentValue;

        if (!hasChanged) {
          return; // No change, skip save
        }

        const updateData: UpdateUserData = { [field]: value } as UpdateUserData;

        // Update profile via API and refresh state with returned user
        const response = await authAPI.updateProfile(updateData);
        const updatedUser = response.data;
        dispatch(updateUser(updatedUser));

        const refreshedData = buildFormDataFromUser(updatedUser);
        setFormData((prev) => ({ ...prev, ...refreshedData }));
        initialFormDataRef.current = refreshedData;
      } catch (error) {
        console.error(`Failed to save field ${field as string}:`, error);
        // Silent fail - don't show toast
      }
    },
    [user, dispatch, buildFormDataFromUser]
  );

  const handleInputChange = useCallback(
    (field: keyof UpdateUserData, value: string | number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Auto-save the field after debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      pendingFieldRef.current = { field, value };

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingFieldRef.current) {
          saveSingleField(
            pendingFieldRef.current.field,
            pendingFieldRef.current.value
          );
          pendingFieldRef.current = null;
        }
      }, 500); // 500ms debounce
    },
    [saveSingleField]
  );

  const handleAvatarUpload = async (file: File) => {
    try {
      const res = await authAPI.uploadAvatar(file);
      const url = res?.avatar_url || res?.user?.avatar_url || res?.url;
      if (url) handleInputChange("avatar_url", url);
    } catch (error) {
      console.error("Avatar upload failed:", error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // If not authenticated or no token, don't render anything (redirect will happen)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const showLoading =
    loadingProfile || !token || !user || typeof window === "undefined";

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        searchTerm=""
        onSearchChange={() => {}}
        showSearchInput={false}
        showPreferencesButton={false}
      />

      <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
        {showLoading ? (
          <div className="py-16 text-center text-gray-600">
            Loading profile...
          </div>
        ) : (
          <StepWrapper
            title="Profile Settings"
            description="Update your profile information. Changes are saved automatically as you type."
          >
            <StepContainer>
              {/* Avatar */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-black mb-2">
                  Avatar
                </label>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-black">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "No avatar"
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                    className="text-sm text-black"
                  />
                </div>
              </div>

              {/* First Name */}
              <div className="mb-6">
                <InputField
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  type="text"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="mb-6">
                <InputField
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) =>
                    handleInputChange("last_name", e.target.value)
                  }
                  type="text"
                  required
                />
              </div>

              {/* Address */}
              <div className="mb-6">
                <InputField
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  type="text"
                  required
                />
              </div>

              {/* Phone */}
              <div className="mb-6">
                <InputField
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  type="tel"
                />
              </div>

              {/* Date of Birth */}
              <div className="mb-6">
                <GlassmorphismDatePicker
                  label="Date of Birth"
                  value={formData.date_of_birth || null}
                  onChange={(date) => handleInputChange("date_of_birth", date)}
                  placeholder="dd.mm.yyyy"
                  maxDate={new Date()}
                  minDate={new Date("1900-01-01")}
                />
              </div>

              {/* Nationality */}
              <div className="mb-6">
                <InputField
                  label="Nationality"
                  value={formData.nationality}
                  onChange={(e) =>
                    handleInputChange("nationality", e.target.value)
                  }
                  type="text"
                />
              </div>

              {/* Occupation */}
              <div>
                <GlassmorphismDropdown
                  label="Occupation"
                  value={formData.occupation ?? ""}
                  options={OCCUPATION_OPTIONS}
                  onChange={(value) =>
                    handleInputChange("occupation", value as string)
                  }
                  placeholder="Select occupation"
                />
              </div>
            </StepContainer>
          </StepWrapper>
        )}
      </div>
    </div>
  );
}
