"use client";

import React, { useRef, useState } from "react";
import { useTranslation } from "../../../../app/hooks/useTranslation";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { profileKeys } from "@/app/lib/translationsKeys/profileTranslationKeys";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { StepWrapper } from "../../../../app/components/preferences/step-components/StepWrapper";
import { StepContainer } from "@/app/components/preferences/step-components/StepContainer";
import { InputField } from "@/app/components/preferences/ui/InputField";
import { PhoneMaskInput, DateInput, Button } from "@/shared/ui";
import { useUserProfile } from "@/shared/hooks/useUserProfile";
import type { User } from "@/app/store/slices/authSlice";
import { AvatarCropModal } from "./AvatarCropModal";
import CountryDropdown from "@/shared/ui/CountryDropdown/CountryDropdown";

interface SimpleProfileFormProps {
  user: User | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const SimpleProfileForm: React.FC<SimpleProfileFormProps> = ({ 
  user, 
  onSuccess,
  onError 
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Use shared profile hook
  const {
    formData,
    phoneCountryCode,
    phoneNumberOnly,
    hasChanges,
    isSaving,
    isLoading,
    dateOfBirthError,
    handleInputChange,
    handlePhoneChange,
    validateForm,
    saveProfile,
    resetForm,
  } = useUserProfile(user, { onSuccess, onError });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        onError?.("Image size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setImageToCrop(imageUrl);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // Create a File from the cropped blob
    const croppedFile = new File([croppedImageBlob], "avatar.jpg", {
      type: "image/jpeg",
    });
    const previewUrl = URL.createObjectURL(croppedImageBlob);
    setAvatarFile(croppedFile);
    setAvatarPreview(previewUrl);
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const success = await saveProfile();
    if (success && avatarFile) {
      // TODO: Upload avatar file separately
      console.log("Avatar file to upload:", avatarFile);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <StepWrapper
        title={t(wizardKeys.profile.title)}
        description={t(wizardKeys.profile.subtitle)}
      >
        <StepContainer>
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Current avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4" />
                </button>
                
                {(avatarPreview || user.avatar_url) && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    disabled={isLoading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isLoading}
              />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={t(wizardKeys.profile.name)}
                value={formData.first_name || ""}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder={t(wizardKeys.profile.name)}
                required
                disabled={isLoading}
              />

              <InputField
                label={t(wizardKeys.profile.lastName)}
                value={formData.last_name || ""}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder={t(wizardKeys.profile.lastName)}
                required
                disabled={isLoading}
              />
            </div>

            <InputField
              label={t(wizardKeys.profile.address)}
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder={t(wizardKeys.profile.address)}
              disabled={isLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(wizardKeys.profile.phone)}
                </label>
                <PhoneMaskInput
                  value={phoneNumberOnly}
                  countryCode={phoneCountryCode}
                  onChange={(value) => handlePhoneChange(value || "", phoneCountryCode)}
                  onCountryChange={(countryCode) => handlePhoneChange(phoneNumberOnly, countryCode)}
                  placeholder={t(wizardKeys.profile.phone)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <DateInput
                  label={t(wizardKeys.profile.birth.title)}
                  name="date_of_birth"
                  value={formData.date_of_birth || null}
                  onChange={(value) => handleInputChange("date_of_birth", value || "")}
                  placeholder={t(wizardKeys.profile.birth.text)}
                  error={dateOfBirthError}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t(wizardKeys.profile.nationality)}
              </label>
              <CountryDropdown
                value={formData.nationality || ""}
                onChange={(value) => handleInputChange("nationality", value)}
                placeholder={t(wizardKeys.profile.nationality)}
                disabled={isLoading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={!hasChanges || isLoading}
              >
                Reset
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!hasChanges || !validateForm() || isLoading}
                loading={isSaving}
              >
                {t(profileKeys.saveChangesBtn)}
              </Button>
            </div>
          </div>
        </StepContainer>
      </StepWrapper>

      {/* Avatar Crop Modal */}
      {showCropModal && imageToCrop && (
        <AvatarCropModal
          imageSrc={imageToCrop}
          onClose={() => {
            setShowCropModal(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};