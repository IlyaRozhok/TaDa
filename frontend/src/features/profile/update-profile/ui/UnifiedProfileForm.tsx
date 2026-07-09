"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useTranslation } from "../../../../app/hooks/useTranslation";
import { profileKeys } from "@/app/lib/translationsKeys/profileTranslationKeys";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { StepWrapper } from "../../../../app/components/preferences/step-components/StepWrapper";
import { StepContainer } from "@/app/components/preferences/step-components/StepContainer";
import { Button } from "@/shared/ui";
import type { User } from "@/store/slices/authSlice";
import { useUnifiedProfile } from "@/shared/hooks/useUnifiedProfile";
import { ProfileFormFields } from "@/shared/components/ProfileFormFields";
import { authAPI } from "@/app/lib/api";
import { AvatarCropModal } from "./AvatarCropModal";

interface UnifiedProfileFormProps {
  user: User | null;
}

export const UnifiedProfileForm: React.FC<UnifiedProfileFormProps> = ({
  user,
}) => {
  const { t } = useTranslation();

  // Memoize options to prevent infinite re-renders
  const profileOptions = useMemo(
    () => ({
      onSuccess: () => {
        // Profile saved successfully
      },
      onError: (error: string) => {
        console.error("Failed to save profile:", error);
      },
    }),
    [],
  );

  const {
    formData,
    phoneCountryCode,
    phoneNumberOnly,
    hasChanges,
    isSaving,
    dateOfBirthError,
    handleInputChange,
    handlePhoneChange,
    validateDateOfBirth,
    validateForm,
    saveProfile,
  } = useUnifiedProfile(user, profileOptions);

  // Avatar handling state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL when component unmounts or avatar changes
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    let success = false;
    let avatarUrlToSave = formData.avatar_url || "";

    // Upload avatar first if file is selected
    if (avatarFile) {
      try {
        const uploadResponse = await authAPI.uploadAvatar(avatarFile);
        const avatarUrl =
          uploadResponse?.avatar_url ||
          uploadResponse?.user?.avatar_url ||
          uploadResponse?.url;

        if (avatarUrl) {
          avatarUrlToSave = avatarUrl;
          handleInputChange("avatar_url", avatarUrl);
          // Cleanup preview
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarPreview(null);
        }
      } catch (error) {
        console.error("Failed to upload avatar:", error);
        return;
      }
    }

    // Save profile data
    success = await saveProfile({ avatar_url: avatarUrlToSave });

    if (success && avatarFile) {
      // Reset avatar state after successful save
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const isFormValid = validateForm();
  const hasAvatarChanges = avatarFile !== null;
  const showSaveButton = hasChanges || hasAvatarChanges;

  // Simple date change handler
  const handleDateChange = useCallback(
    (date: string | null) => {
      handleInputChange("date_of_birth", date || "");
    },
    [handleInputChange],
  );

  // Show error state if user data is not available (don't show loading since parent handles it)
  if (!user?.id) {
    return (
      <StepWrapper
        title={t(profileKeys.dropProfileSettings)}
        description="Unable to load profile information"
      >
        <StepContainer>
          <div className="py-16 text-center text-gray-600">
            <p>Unable to load profile data. Please refresh the page.</p>
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
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white cursor-pointer rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2"
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
                        handleInputChange("avatar_url", "");
                      }
                    }}
                    disabled={isSaving}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer bg-gray-200 text-gray-700 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2"
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

        {/* Profile Form Fields */}
        <ProfileFormFields
          formData={formData}
          phoneCountryCode={phoneCountryCode}
          phoneNumberOnly={phoneNumberOnly}
          dateOfBirthError={dateOfBirthError}
          onInputChange={handleInputChange}
          onPhoneChange={handlePhoneChange}
          onDateChange={handleDateChange}
        />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!isFormValid || !showSaveButton || isSaving}
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
