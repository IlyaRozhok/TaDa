"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  updateUser,
} from "../../store/slices/authSlice";
import { authAPI } from "../../lib/api";
import { StepWrapper } from "../preferences/step-components/StepWrapper";
import { StepContainer } from "../preferences/step-components/StepContainer";
import { InputField } from "../preferences/ui/InputField";
import { GlassmorphismDatePicker } from "../preferences/ui/GlassmorphismDatePicker";

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
}

interface OnboardingProfileStepProps {
  onComplete: () => void;
  isLoading?: boolean;
  onNext?: () => void;
}

export default function OnboardingProfileStep({
  onComplete,
  isLoading: externalLoading,
  onNext,
}: OnboardingProfileStepProps) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    phone: "",
    date_of_birth: "",
    nationality: "",
    occupation: "",
  });

  useEffect(() => {
    if (user) {
      const profile =
        user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

      const splitFullName = (full?: string | null) => {
        if (!full) return { first: "", last: "" };
        const parts = full.trim().split(" ");
        if (parts.length === 1) return { first: parts[0], last: "" };
        const [first, ...rest] = parts;
        return { first, last: rest.join(" ") };
      };

      const nameFallback = splitFullName(
        (profile as any)?.full_name || user.full_name
      );

      let formattedDateOfBirth = "";
      // Check if profile has date_of_birth (for tenant profile)
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

        if (field === "date_of_birth") {
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
        dispatch(updateUser(updateData as any));

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

  const handleSubmit = async () => {
    // Flush any pending saves before moving to next step
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (pendingFieldRef.current) {
      await saveSingleField(
        pendingFieldRef.current.field,
        pendingFieldRef.current.value
      );
      pendingFieldRef.current = null;
    }

    // Persist current form data even if fields were unchanged (ensures defaults stick)
    try {
      await authAPI.updateProfile(formData);
      dispatch(updateUser(formData as any));
    } catch (error) {
      console.error("Failed to persist profile before next step:", error);
    }

    // Move to next step
    onComplete();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <StepWrapper
      title="Complete Your Profile"
      description="Let's start by setting up your profile. This information helps us personalize your experience."
    >
      <StepContainer>
        {/* First Name */}
        <div className="mb-6">
          <InputField
            label="First Name"
            value={formData.first_name}
            onChange={(e) => handleInputChange("first_name", e.target.value)}
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
            onChange={(e) => handleInputChange("nationality", e.target.value)}
            type="text"
          />
        </div>

        {/* Occupation */}
        <div>
          <InputField
            label="Occupation"
            value={formData.occupation}
            onChange={(e) => handleInputChange("occupation", e.target.value)}
            type="text"
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
}
