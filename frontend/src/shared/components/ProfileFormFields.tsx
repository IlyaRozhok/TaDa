"use client";

import React, { useCallback } from "react";
import { useTranslation } from "@/app/hooks/useTranslation";
import InlinePhoneVerification from "@/app/components/phone-verification/InlinePhoneVerification";
import { usePhoneVerificationText } from "@/app/components/phone-verification/usePhoneVerificationText";
import { phoneVerificationKeys } from "@/app/lib/translationsKeys/phoneVerificationKeys";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { InputField } from "@/app/components/preferences/ui/InputField";
import { DateInput } from "@/shared/ui";
import CountryDropdown from "@/shared/ui/CountryDropdown/CountryDropdown";
import { UpdateUserData } from "@/app/types/user";

interface ProfileFormFieldsProps {
  formData: UpdateUserData;
  /** The SMS-verified number (E.164): shown read-only instead of the input. */
  verifiedPhone?: string | null;
  /**
   * Where the verification's primary button (Send code / Confirm) renders —
   * the onboarding form puts it at its very bottom. Without it the button
   * sits right under the field (profile settings).
   */
  phoneActionContainer?: Element | null;
  dateOfBirthError: string | null;
  onInputChange: (field: keyof UpdateUserData, value: string) => void;
  onPhoneChange: (phoneNumber: string, countryCode: string) => void;
  onDateChange: (date: string | null) => void;
  className?: string;
}

export const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  formData,
  verifiedPhone,
  phoneActionContainer,
  dateOfBirthError,
  onInputChange,
  onPhoneChange,
  onDateChange,
  className = "",
}) => {
  const { t } = useTranslation();
  const tx = usePhoneVerificationText();

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

      {/* Phone, in onboarding and profile settings alike: send → code →
          verified, in place at the bottom of the form — no route change (the
          standalone /app/verify-phone screen is only for the login gate).
          Once verified the number is read-only and every save carries it
          unchanged (useUnifiedProfile); "Change number" re-verifies in place.
          Without verification (gate off) the typed number still reaches the
          hook and is saved with the form. */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{tx(phoneVerificationKeys.verify.title)}</h3>
        <InlinePhoneVerification
          verifiedPhone={verifiedPhone ?? null}
          initialPhone={formData.phone}
          onNumberChange={(national, country) => onPhoneChange(national, country)}
          actionContainer={phoneActionContainer}
        />
      </section>
    </div>
  );
};