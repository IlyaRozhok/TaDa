"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  updateUser,
} from "../../store/slices/authSlice";
import { authAPI } from "../../lib/api";
import { StepWrapper } from "../preferences/step-components/StepWrapper";
import { StepContainer } from "../preferences/step-components/StepContainer";
import { InputField } from "../preferences/step-components/InputField";
import toast from "react-hot-toast";

interface UpdateUserData {
  full_name?: string;
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

  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: "",
    phone: "",
    date_of_birth: "",
    nationality: "",
    occupation: "",
  });

  useEffect(() => {
    if (user) {
      const profile =
        user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

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

      setFormData({
        full_name: user.full_name || "",
        phone: profile?.phone || "",
        date_of_birth: formattedDateOfBirth,
        nationality: (profile as any)?.nationality || "",
        occupation: (profile as any)?.occupation || "",
      });
    }
  }, [user]);

  const handleInputChange = (
    field: keyof UpdateUserData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const updateData: UpdateUserData = {};

      if (!user) {
        setError("User not found");
        return;
      }

      // Get profile data for comparison
      const profile =
        user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

      // Only include fields that have changed
      Object.keys(formData).forEach((key) => {
        const fieldKey = key as keyof UpdateUserData;
        let currentValue;

        if (fieldKey === "full_name") {
          currentValue = user[fieldKey];
        } else if (fieldKey === "date_of_birth") {
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
        } else if (fieldKey === "nationality") {
          currentValue = (profile as any)?.[fieldKey];
        } else {
          currentValue = profile?.[fieldKey as keyof typeof profile];
        }

        if (formData[fieldKey] !== currentValue) {
          if (
            fieldKey === "date_of_birth" &&
            (!formData[fieldKey] || formData[fieldKey].trim() === "")
          ) {
            // Skip empty date
          } else {
            updateData[fieldKey] = formData[fieldKey];
          }
        }
      });

      // Update profile via API
      if (Object.keys(updateData).length > 0) {
        await authAPI.updateProfile(updateData);
        dispatch(updateUser(updateData));
        toast.success("Profile updated successfully");
      }

      // Move to next step
      onComplete();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // Expose submit handler to parent via onNext prop
  useEffect(() => {
    if (onNext) {
      // Replace onNext with our submit handler
      const originalOnNext = onNext;
      (onNext as any) = () => {
        handleSubmit();
      };
    }
  }, [formData, user, onNext]);

  return (
    <StepWrapper
      title="Complete Your Profile"
      description="Let's start by setting up your profile. This information helps us personalize your experience."
    >
      <StepContainer>
        {/* Full Name */}
        <div className="mb-6">
          <InputField
            label="Full Name"
            value={formData.full_name}
            onChange={(value) =>
              handleInputChange("full_name", value as string)
            }
            type="text"
          />
        </div>

        {/* Phone */}
        <div className="mb-6">
          <InputField
            label="Phone Number"
            value={formData.phone}
            onChange={(value) => handleInputChange("phone", value as string)}
            type="tel"
          />
        </div>

        {/* Date of Birth */}
        <div className="mb-6">
          <InputField
            label="Date of Birth"
            value={formData.date_of_birth}
            onChange={(value) =>
              handleInputChange("date_of_birth", value as string)
            }
            type="date"
          />
        </div>

        {/* Nationality */}
        <div className="mb-6">
          <InputField
            label="Nationality"
            value={formData.nationality}
            onChange={(value) =>
              handleInputChange("nationality", value as string)
            }
            type="text"
          />
        </div>

        {/* Occupation */}
        <div>
          <InputField
            label="Occupation"
            value={formData.occupation}
            onChange={(value) =>
              handleInputChange("occupation", value as string)
            }
            type="text"
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
}
