"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  updateUser,
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
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
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
  });

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    // Check if token exists in localStorage
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    // If no token or not authenticated, redirect to landing page
    if (!token || !isAuthenticated) {
      router.replace("/app/auth/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      const splitFullName = (full?: string | null) => {
        if (!full) return { first: "", last: "" };
        const parts = full.trim().split(" ");
        if (parts.length === 1) return { first: parts[0], last: "" };
        const [first, ...rest] = parts;
        return { first, last: rest.join(" ") };
      };

      // Get profile data based on user role
      const profile =
        user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

      const nameFallback = splitFullName(
        (profile as any)?.full_name || user.full_name
      );

      // Format date_of_birth for HTML date input (YYYY-MM-DD)
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

      const initialData = {
        first_name: (profile as any)?.first_name || nameFallback.first || "",
        last_name: (profile as any)?.last_name || nameFallback.last || "",
        address: (profile as any)?.address || "",
        email: user.email || "",
        phone: profile?.phone || "",
        date_of_birth: formattedDateOfBirth,
        nationality: (profile as any)?.nationality || "",
        occupation: (profile as any)?.occupation || "",
      };
      setFormData(initialData);
      initialFormDataRef.current = initialData;
    }
  }, [user]);

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

        // Prepare update data
        const updateData: UpdateUserData = { [field]: value } as UpdateUserData;

        // Update profile via API
        await authAPI.updateProfile(updateData);
        dispatch(updateUser(updateData));

        // Update initial form data reference
        if (initialFormDataRef.current) {
          initialFormDataRef.current = {
            ...initialFormDataRef.current,
            [field]: value,
          };
        }
      } catch (error) {
        console.error(`Failed to save field ${field as string}:`, error);
        // Silent fail - don't show toast
      }
    },
    [user, dispatch]
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
  if (!token || !isAuthenticated) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        searchTerm=""
        onSearchChange={() => {}}
        showSearchInput={false}
        showPreferencesButton={false}
      />

      <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
        <StepWrapper
          title="Profile Settings"
          description="Update your profile information. Changes are saved automatically as you type."
        >
          <StepContainer>
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
                onChange={(e) => handleInputChange("last_name", e.target.value)}
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
                value={formData.occupation}
                options={OCCUPATION_OPTIONS}
                onChange={(value) =>
                  handleInputChange("occupation", value as string)
                }
                placeholder="Select occupation"
              />
            </div>
          </StepContainer>
        </StepWrapper>
      </div>
    </div>
  );
}
