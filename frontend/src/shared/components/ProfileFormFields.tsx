"use client";

import React, { useCallback } from "react";
import { translateWithFallback, useTranslation } from "@/app/hooks/useTranslation";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { InputField } from "@/app/components/preferences/ui/InputField";
import { PhoneMaskInput, DateInput } from "@/shared/ui";
import CountryDropdown from "@/shared/ui/CountryDropdown/CountryDropdown";
import { UpdateUserData } from "@/app/types/user";

interface ProfileFormFieldsProps {
  formData: UpdateUserData;
  phoneCountryCode: string;
  phoneNumberOnly: string;
  dateOfBirthError: string | null;
  onInputChange: (field: keyof UpdateUserData, value: string) => void;
  onPhoneChange: (phoneNumber: string, countryCode: string) => void;
  onDateChange: (date: string | null) => void;
  className?: string;
}

export const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  formData,
  phoneCountryCode,
  phoneNumberOnly,
  dateOfBirthError,
  onInputChange,
  onPhoneChange,
  onDateChange,
  className = "",
}) => {
  const { t } = useTranslation();

  // The hook is the single writer of `formData.phone` (E.164); this only
  // reports what the field shows.
  const handlePhoneChange = useCallback((value: string | undefined) => {
    onPhoneChange(value || "", phoneCountryCode);
  }, [phoneCountryCode, onPhoneChange]);

  // Clear the phone input when country changes
  const handleCountryChange = useCallback((countryCode: string) => {
    onPhoneChange("", countryCode);
  }, [onPhoneChange]);

  const handleDateChange = useCallback((date: string | null) => {
    onInputChange("date_of_birth", date || "");
    onDateChange(date);
  }, [onInputChange, onDateChange]);

  return (
    <div className={className}>
      {/* First Name */}
      <div className="mb-6">
        <InputField
          label={t(wizardKeys.profile.name)}
          value={formData.first_name || ""}
          onChange={(e) => onInputChange("first_name", e.target.value)}
          type="text"
          required
        />
      </div>

      {/* Last Name */}
      <div className="mb-6">
        <InputField
          label={t(wizardKeys.profile.lastName)}
          value={formData.last_name || ""}
          onChange={(e) => onInputChange("last_name", e.target.value)}
          type="text"
          required
        />
      </div>

      {/* Address */}
      <div className="mb-6">
        <InputField
          label={t(wizardKeys.profile.address)}
          value={formData.address || ""}
          onChange={(e) => onInputChange("address", e.target.value)}
          type="text"
          required
        />
      </div>

      {/* Phone */}
      <div className="mb-6">
        <PhoneMaskInput
          countryCode={phoneCountryCode}
          label={t(wizardKeys.profile.phone)}
          value={phoneNumberOnly}
          onChange={handlePhoneChange}
          onCountryChange={handleCountryChange}
          invalidMessage={translateWithFallback(
            t,
            wizardKeys.profile.phoneInvalid,
            "Enter a valid phone number",
          )}
          required
        />
      </div>

      {/* Date of Birth */}
      <div className="mb-6">
        <DateInput
          label={t(wizardKeys.profile.birth.title)}
          name="date_of_birth"
          value={formData.date_of_birth || null}
          onChange={handleDateChange}
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
          placeholder={t(wizardKeys.profile.birth.text)}
        />
      </div>

      {/* Nationality */}
      <div className="mb-6">
        <CountryDropdown
          label={t(wizardKeys.profile.nationality)}
          value={formData.nationality ?? undefined}
          onChange={(value) => onInputChange("nationality", value)}
          placeholder={t(wizardKeys.profile.nationality)}
          required
        />
      </div>

    </div>
  );
};