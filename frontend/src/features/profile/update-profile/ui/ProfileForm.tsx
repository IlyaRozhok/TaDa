"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { StepWrapper } from "../../../../app/components/preferences/step-components/StepWrapper";
import { StepContainer } from "../../../../app/components/preferences/step-components/StepContainer";
import { InputField } from "../../../../app/components/preferences/ui/InputField";
import { GlassmorphismDropdown } from "../../../../app/components/preferences/ui/GlassmorphismDropdown";
import { PhoneMaskInput, DateInput, Button } from "../../../../shared/ui";
import { getCountryByDialCode, getCountryByCode, getDefaultCountry } from "../../../../shared/lib/countries";
import { NATIONALITY_OPTIONS } from "../../../../shared/lib/nationalities";
import { User, UpdateUserData } from "../../../../entities/user/model/types";
import { buildFormDataFromUser } from "../../../../entities/user/lib/utils";
import { useProfileUpdate } from "../model/useProfileUpdate";
import { authAPI } from "../../../../app/lib/api";
import { updateUser } from "../../../../app/store/slices/authSlice";


interface ProfileFormProps {
  user: User | null;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<UpdateUserData>(() =>
    buildFormDataFromUser(user)
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState("GB"); // Default to GB for UK-based platform
  const [phoneNumberOnly, setPhoneNumberOnly] = useState(""); // Store phone number without country code
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { handleAvatarUpload } = useProfileUpdate(user);

  // Helper function to parse phone number
  const parsePhoneNumber = useCallback((phoneNumber: string) => {
    if (!phoneNumber) {
      setPhoneCountryCode("GB");
      setPhoneNumberOnly("");
      return;
    }

    // Try to find country by dial code from the phone number
    const country = getCountryByDialCode(phoneNumber.substring(0, 4)) || 
                   getCountryByDialCode(phoneNumber.substring(0, 3)) || 
                   getCountryByDialCode(phoneNumber.substring(0, 2)) ||
                   getDefaultCountry();
    
    setPhoneCountryCode(country.code);
    setPhoneNumberOnly(phoneNumber.slice(country.dialCode.length));
  }, []);

  // Update form data when user changes and parse phone number once
  useEffect(() => {
    if (user?.id) {
      const newFormData = buildFormDataFromUser(user);
      setFormData(newFormData);
      
      // Parse phone number only when user data changes
      parsePhoneNumber(newFormData.phone || "");
    }
  }, [user, parsePhoneNumber]);

  // Track changes to enable/disable save button
  useEffect(() => {
    const initialData = buildFormDataFromUser(user);
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(hasFormChanges);
  }, [formData, user]);

  const updateFormData = (updates: UpdateUserData) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update profile via API
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data;
      
      // Update Redux store with the latest user data
      dispatch(updateUser(updatedUser));
      
      // Reset changes state after successful save
      setHasChanges(false);
      
      console.log("Profile saved successfully", updatedUser);
    } catch (error) {
      console.error("Failed to save profile:", error);
      // You could show an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state if user data is not available
  if (!user?.id) {
    return (
      <StepWrapper
        title="Profile Settings"
        description="Loading your profile information..."
      >
        <StepContainer>
          <div className="py-16 text-center text-gray-600">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
            Loading profile data...
          </div>
        </StepContainer>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper
      title="Profile Settings"
      description="Update your profile information and click Save to apply changes."
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
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Create a preview URL for immediate display
                  const previewUrl = URL.createObjectURL(file);
                  updateFormData({ avatar_url: previewUrl });
                  
                  // Upload the file to server
                  await handleAvatarUpload(file, updateFormData);
                }
              }}
              className="text-sm text-black"
            />
          </div>
        </div>

        {/* First Name */}
        <div className="mb-6">
          <InputField
            label="First Name"
            value={formData.first_name || ""}
            onChange={(e) => updateFormData({ first_name: e.target.value })}
            type="text"
            required
          />
        </div>

        {/* Last Name */}
        <div className="mb-6">
          <InputField
            label="Last Name"
            value={formData.last_name || ""}
            onChange={(e) => updateFormData({ last_name: e.target.value })}
            type="text"
            required
          />
        </div>

        {/* Address */}
        <div className="mb-6">
          <InputField
            label="Address"
            value={formData.address || ""}
            onChange={(e) => updateFormData({ address: e.target.value })}
            type="text"
            required
          />
        </div>

        {/* Phone */}
        <div className="mb-6">
          <PhoneMaskInput
            countryCode={phoneCountryCode}
            label="Phone Number"
            value={phoneNumberOnly}
            onChange={(value) => {
              setPhoneNumberOnly(value || "");
              // Combine country code with phone number for storage
              // Don't strip formatting here - let InputMask handle it internally
              const country = getCountryByCode(phoneCountryCode) || getDefaultCountry();
              if (value) {
                // Only extract digits when we need to store the final value
                const digitsOnly = value.replace(/\D/g, '');
                const fullPhoneNumber = `${country.dialCode}${digitsOnly}`;
                updateFormData({ phone: fullPhoneNumber });
              } else {
                updateFormData({ phone: "" });
              }
            }}
            onCountryChange={(countryCode) => {
              setPhoneCountryCode(countryCode);
              // Clear the phone input when country changes
              setPhoneNumberOnly("");
              updateFormData({ phone: "" });
            }}
            required
          />
        </div>

        {/* Date of Birth */}
        <div className="mb-6">
          <DateInput
            label="Date of Birth"
            name="date_of_birth"
            value={formData.date_of_birth || null}
            onChange={(date) => updateFormData({ date_of_birth: date })}
            maxDate={new Date().toISOString().split("T")[0]} // Today's date in YYYY-MM-DD format
            minDate="1900-01-01"
            required
          />
        </div>

        {/* Nationality */}
        <div className="mb-6">
          <GlassmorphismDropdown
            label="Nationality"
            value={formData.nationality ?? ""}
            options={NATIONALITY_OPTIONS}
            onChange={(value) => updateFormData({ nationality: value as string })}
            placeholder="Select nationality"
            required
          />
        </div>


        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
