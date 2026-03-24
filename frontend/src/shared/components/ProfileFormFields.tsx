"use client";

import React, { useCallback } from "react";
import { useTranslation } from "../../app/hooks/useTranslation";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { InputField } from "@/app/components/preferences/ui/InputField";
import { PhoneMaskInput, DateInput } from "@/shared/ui";
import CountryDropdown from "@/shared/ui/CountryDropdown/CountryDropdown";
import { UpdateUserData } from "@/entities/user/model/types";
import { getCountryByCode, getDefaultCountry } from "@/shared/lib/countries";

interface ProfileFormFieldsProps {
  formData: UpdateUserData;
  phoneCountryCode: string;
  phoneNumberOnly: string;
  dateOfBirthError: string | null;
  onInputChange: (field: keyof UpdateUserData, value: string) => void;
  onPhoneChange: (phoneNumber: string, countryCode: string) => void;
  onDateChange: (date: string | null) => void;
  showOccupation?: boolean;
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
  showOccupation = false,
  className = "",
}) => {
  const { t } = useTranslation();

  const handlePhoneChange = useCallback((value: string) => {
    // Combine country code with phone number for storage
    const country = getCountryByCode(phoneCountryCode) || getDefaultCountry();
    if (value) {
      // Only extract digits when we need to store the final value
      const digitsOnly = value.replace(/\D/g, "");
      const fullPhoneNumber = `${country.dialCode}${digitsOnly}`;
      onInputChange("phone", fullPhoneNumber);
    } else {
      onInputChange("phone", "");
    }
    onPhoneChange(value || "", phoneCountryCode);
  }, [phoneCountryCode, onInputChange, onPhoneChange]);

  const handleCountryChange = useCallback((countryCode: string) => {
    // Clear the phone input when country changes
    onPhoneChange("", countryCode);
    onInputChange("phone", "");
  }, [onPhoneChange, onInputChange]);

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

      {/* Occupation (optional, for certain contexts) */}
      {showOccupation && (
        <div className="mb-6">
          <InputField
            label="Occupation"
            value={formData.occupation || ""}
            onChange={(e) => onInputChange("occupation", e.target.value)}
            type="text"
          />
        </div>
      )}
    </div>
  );
};