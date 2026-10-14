"use client";

import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "@/app/hooks/useTranslation";
import { selectUser } from "@/store/slices/authSlice";
import { useGetPhoneVerificationConfigQuery } from "@/store/api/phoneVerification.api";
import { isPhoneVerificationRequired } from "@/shared/lib/phoneVerification";
import InlinePhoneVerification from "@/app/components/phone-verification/InlinePhoneVerification";
import VerifiedPhoneField from "@/app/components/phone-verification/VerifiedPhoneField";
import { usePhoneVerificationText } from "@/app/components/phone-verification/usePhoneVerificationText";
import { phoneVerificationKeys } from "@/app/lib/translationsKeys/phoneVerificationKeys";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { InputField } from "@/app/components/preferences/ui/InputField";
import { PhoneMaskInput, DateInput } from "@/shared/ui";
import CountryDropdown from "@/shared/ui/CountryDropdown/CountryDropdown";
import { UpdateUserData } from "@/app/types/user";

interface ProfileFormFieldsProps {
  formData: UpdateUserData;
  /** The plain phone field's country and number (gate off). */
  phoneCountryCode: string;
  phoneNumberOnly: string;
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
  phoneCountryCode,
  phoneNumberOnly,
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
  const user = useSelector(selectUser);
  const { data: phoneConfig } = useGetPhoneVerificationConfigQuery();
  // Gate off: a plain optional phone field and no verification UI at all,
  // so nothing in these forms can send a code. Gate on: the inline flow.
  const verificationRequired = isPhoneVerificationRequired(phoneConfig, user);

  // The hook is the single writer of `formData.phone` (E.164); this only
  // reports what the field shows.
  const handlePhoneChange = useCallback((value: string | undefined, detectedCountry?: string) => {
    onPhoneChange(value || "", detectedCountry ?? phoneCountryCode);
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

      {/* Phone, gate off: the plain optional field, as before verification
          existed. A number already verified stays read-only (the save
          carries it unchanged), with no "Change number": that would send a
          code. */}
      {!verificationRequired && (
        <div className="mb-6">
          {verifiedPhone ? (
            <VerifiedPhoneField phone={verifiedPhone} />
          ) : (
            <PhoneMaskInput
              countryCode={phoneCountryCode}
              label={t(wizardKeys.profile.phone)}
              value={phoneNumberOnly}
              onChange={handlePhoneChange}
              onCountryChange={handleCountryChange}
              // Optional, as `validateForm` has it: an empty phone is fine, a
              // wrong one is explained once the field loses focus.
              validate
            />
          )}
        </div>
      )}

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

      {/* Phone, gate on, in onboarding and profile settings alike: send →
          code → verified, in place at the bottom of the form — no route
          change (the standalone /app/verify-phone screen is only for the
          login gate). Once verified the number is read-only and every save
          carries it unchanged (useUnifiedProfile); "Change number"
          re-verifies in place. */}
      {verificationRequired && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{tx(phoneVerificationKeys.verify.title)}</h3>
          <InlinePhoneVerification
            verifiedPhone={verifiedPhone ?? null}
            initialPhone={formData.phone}
            onNumberChange={(national, country) => onPhoneChange(national, country)}
            actionContainer={phoneActionContainer}
          />
        </section>
      )}
    </div>
  );
};