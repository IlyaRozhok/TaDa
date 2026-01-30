"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "../../../../app/hooks/useTranslation";
import { profileKeys } from "@/app/lib/translationsKeys/profileTranslationKeys";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { StepWrapper } from "../../../../app/components/preferences/step-components/StepWrapper";
import { StepContainer } from "../../../../app/components/preferences/step-components/StepContainer";
import { InputField } from "../../../../app/components/preferences/ui/InputField";
import {
  PhoneMaskInput,
  DateInput,
  Button,
  CountryDropdown,
} from "../../../../shared/ui";
import {
  getCountryByDialCode,
  getCountryByCode,
  getDefaultCountry,
} from "../../../../shared/lib/countries";
import { User, UpdateUserData } from "../../../../entities/user/model/types";
import { buildFormDataFromUser } from "../../../../entities/user/lib/utils";
import { useProfileUpdate } from "../model/useProfileUpdate";
import { authAPI } from "../../../../app/lib/api";
import { updateUser } from "../../../../app/store/slices/authSlice";
import { AvatarCropModal } from "./AvatarCropModal";

interface ProfileFormProps {
  user: User | null;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<UpdateUserData>(() =>
    buildFormDataFromUser(user),
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState("GB"); // Default to GB for UK-based platform
  const [phoneNumberOnly, setPhoneNumberOnly] = useState(""); // Store phone number without country code
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateOfBirthError, setDateOfBirthError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to parse phone number
  const parsePhoneNumber = useCallback((phoneNumber: string) => {
    if (!phoneNumber) {
      setPhoneCountryCode("GB");
      setPhoneNumberOnly("");
      return;
    }

    // Try to find country by dial code from the phone number
    const country =
      getCountryByDialCode(phoneNumber.substring(0, 4)) ||
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

  // Validate form - check if all required fields are filled
  const validateForm = useCallback((): boolean => {
    const requiredFields: (keyof UpdateUserData)[] = [
      "first_name",
      "last_name",
      "address",
      "phone",
      "date_of_birth",
      "nationality",
    ];

    // Check all required fields are filled
    for (const field of requiredFields) {
      const value = formData[field];
      if (!value || String(value).trim() === "") {
        return false;
      }
    }

    // Check date of birth validation error
    if (dateOfBirthError) {
      return false;
    }

    return true;
  }, [formData, dateOfBirthError]);

  // Track form validity
  const isFormValid = validateForm();

  // Track changes to enable/disable save button
  useEffect(() => {
    const initialData = buildFormDataFromUser(user);
    const hasFormChanges =
      JSON.stringify(formData) !== JSON.stringify(initialData);
    // Also check if avatar file is selected
    setHasChanges(hasFormChanges || avatarFile !== null);
  }, [formData, user, avatarFile]);

  // Cleanup preview URL when component unmounts or avatar changes
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const updateFormData = (updates: UpdateUserData) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!isFormValid) {
      return;
    }

    // Validate date of birth before saving
    if (dateOfBirthError) {
      return;
    }

    // Validate age if date_of_birth is provided
    if (formData.date_of_birth) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birthDate = new Date(formData.date_of_birth);
      birthDate.setHours(0, 0, 0, 0);

      // Check if date is in the future
      if (birthDate > today) {
        setDateOfBirthError("Date of birth cannot be in the future");
        return;
      }

      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        setDateOfBirthError("You must be at least 18 years old");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Prepare update data
      const updateData = { ...formData };

      // Upload avatar first if file is selected
      if (avatarFile) {
        try {
          const uploadResponse = await authAPI.uploadAvatar(avatarFile);
          const avatarUrl =
            uploadResponse?.avatar_url ||
            uploadResponse?.user?.avatar_url ||
            uploadResponse?.url;
          if (avatarUrl) {
            // Update formData with uploaded avatar URL
            updateData.avatar_url = avatarUrl;
            // Cleanup preview
            if (avatarPreview) {
              URL.revokeObjectURL(avatarPreview);
            }
            setAvatarPreview(null);
            setAvatarFile(null);
          }
        } catch (error) {
          console.error("Failed to upload avatar:", error);
          throw error;
        }
      }

      // Update profile via API (including avatar_url if it was removed or changed)
      const response = await authAPI.updateProfile(updateData);
      const updatedUser = response.data;

      // Refresh user data from server to get latest avatar_url
      const meResponse = await authAPI.getMe();
      const freshUser = meResponse.data?.user || updatedUser;

      // Update Redux store with the latest user data (including avatar_url)
      dispatch(updateUser(freshUser));

      // Update local form data with fresh user data
      const freshFormData = buildFormDataFromUser(freshUser);
      setFormData(freshFormData);

      // Reset changes state after successful save
      setHasChanges(false);

      console.log("Profile saved successfully", freshUser);
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
        title={t(profileKeys.dropProfileSettings)}
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
      title={t(profileKeys.dropProfileSettings)}
      description={t(profileKeys.settingsDescription)}
      className="pt-12 sm:pt-16 md:pt-20 lg:pt-24"
    >
      <StepContainer>
        {/* Avatar */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-black mb-4">
            {t(profileKeys.avatar)}
          </label>
          <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              {isSaving && avatarFile && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {formData.avatar_url || avatarPreview
                    ? t(profileKeys.changeAvatar)
                    : t(profileKeys.uploadAvatar)}
                </button>
                {(formData.avatar_url || avatarPreview) && (
                  <button
                    type="button"
                    onClick={() => {
                      // Clear preview and file
                      if (avatarPreview) {
                        URL.revokeObjectURL(avatarPreview);
                      }
                      setAvatarPreview(null);
                      setAvatarFile(null);
                      // If there was an existing avatar, mark for removal
                      if (formData.avatar_url) {
                        updateFormData({ avatar_url: "" });
                      }
                      setHasChanges(true);
                    }}
                    disabled={isSaving}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {t(profileKeys.avatarRemove)}
                  </button>
                )}
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Validate file size (5MB)
                  const maxSize = 5 * 1024 * 1024;
                  if (file.size > maxSize) {
                    alert("File size must be less than 5MB");
                    return;
                  }

                  // Create preview URL and show crop modal
                  const previewUrl = URL.createObjectURL(file);
                  setImageToCrop(previewUrl);
                  setShowCropModal(true);

                  // Reset input to allow selecting the same file again
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }
              }}
              className="hidden"
            />

            {/* Crop Modal */}
            {showCropModal && imageToCrop && (
              <AvatarCropModal
                imageSrc={imageToCrop}
                onClose={() => {
                  setShowCropModal(false);
                  if (imageToCrop) {
                    URL.revokeObjectURL(imageToCrop);
                  }
                  setImageToCrop(null);
                }}
                onCropComplete={(croppedBlob) => {
                  // Create a File from the cropped blob
                  const croppedFile = new File([croppedBlob], "avatar.jpg", {
                    type: "image/jpeg",
                  });

                  // Create preview URL
                  const previewUrl = URL.createObjectURL(croppedFile);
                  setAvatarPreview(previewUrl);
                  setAvatarFile(croppedFile);
                  setHasChanges(true);

                  // Cleanup
                  setShowCropModal(false);
                  if (imageToCrop) {
                    URL.revokeObjectURL(imageToCrop);
                  }
                  setImageToCrop(null);
                }}
              />
            )}
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
              const country =
                getCountryByCode(phoneCountryCode) || getDefaultCountry();
              if (value) {
                // Only extract digits when we need to store the final value
                const digitsOnly = value.replace(/\D/g, "");
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
            onChange={(date) => {
              // Always update the form data, even if invalid
              // This allows the user to see what they typed and get validation feedback
              updateFormData({ date_of_birth: date });

              // Validate age (must be 18+)
              if (date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const birthDate = new Date(date);
                birthDate.setHours(0, 0, 0, 0);

                // Check if date is in the future
                if (birthDate > today) {
                  setDateOfBirthError("Date of birth cannot be in the future");
                  return;
                }

                // Check if date is too old (more than 120 years)
                const minDate = new Date();
                minDate.setFullYear(today.getFullYear() - 120);
                minDate.setHours(0, 0, 0, 0);
                if (birthDate < minDate) {
                  setDateOfBirthError("Please enter a valid date of birth");
                  return;
                }

                // Calculate age
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (
                  monthDiff < 0 ||
                  (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ) {
                  age--;
                }

                if (age < 18) {
                  setDateOfBirthError("You must be at least 18 years old");
                } else {
                  setDateOfBirthError(null);
                }
              } else {
                setDateOfBirthError(null);
              }
            }}
            maxDate={(() => {
              // Maximum date: 18 years ago (user must be 18+)
              const maxDate = new Date();
              maxDate.setFullYear(maxDate.getFullYear() - 18);
              return maxDate.toISOString().split("T")[0];
            })()}
            minDate={(() => {
              // Minimum date: 120 years ago
              const minDate = new Date();
              minDate.setFullYear(minDate.getFullYear() - 120);
              return minDate.toISOString().split("T")[0];
            })()}
            error={dateOfBirthError || undefined}
            required
          />
        </div>

        {/* Nationality */}
        <div className="mb-6">
          <CountryDropdown
            label="Nationality"
            value={formData.nationality ?? undefined}
            onChange={(value) => updateFormData({ nationality: value })}
            placeholder="Select nationality"
            required
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!isFormValid || !hasChanges || isSaving}
            className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              t(profileKeys.saveChangesBtn)
            )}
          </Button>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
