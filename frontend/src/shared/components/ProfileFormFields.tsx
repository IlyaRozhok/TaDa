"use client";

import React, { useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/app/hooks/useTranslation";
import { phoneVerificationHref } from "@/shared/lib/phoneVerification";
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
  phoneCountryCode: string;
  phoneNumberOnly: string;
  /** The SMS-verified number (E.164): shown read-only instead of the input. */
  verifiedPhone?: string | null;
  /**
   * "link" (profile page): the phone field sits with the other fields, and a
   * verified number links to /app/verify-phone to change it. "inline"
   * (onboarding): a "Verify your phone" section at the bottom runs the whole
   * verification in place.
   */
  phoneVerification?: "link" | "inline";
  /** Inline mode: where the verification's primary button renders (the form's bottom). */
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
  phoneVerification = "link",
  phoneActionContainer,
  dateOfBirthError,
  onInputChange,
  onPhoneChange,
  onDateChange,
  className = "",
}) => {
  const { t } = useTranslation();
  const tx = usePhoneVerificationText();
  // "Change number" comes back here once the new number is verified.
  const pathname = usePathname();

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

      {/* Phone (profile page): a verified number is shown, not asked for
          again; it changes only by re-verifying on the verification screen.
          The onboarding form verifies inline at the bottom instead. */}
      {phoneVerification === "link" && (
        <div className="mb-6">
          {verifiedPhone ? (
            <VerifiedPhoneField phone={verifiedPhone} changeHref={phoneVerificationHref(pathname)} />
          ) : (
            <PhoneMaskInput
              countryCode={phoneCountryCode}
              label={t(wizardKeys.profile.phone)}
              value={phoneNumberOnly}
              onChange={handlePhoneChange}
              onCountryChange={handleCountryChange}
              // Optional, as `validateForm` has it: an empty phone is fine, a
              // wrong one is explained once the field loses focus. (The old
              // `required` attribute was inert — these forms never submit
              // natively — and would now show a "required" message.)
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

      {/* Onboarding: send → code → verified, in place at the bottom of the
          form — no route change. Once verified the number is read-only and
          every save carries it unchanged (useUnifiedProfile), so the phone is
          collected once. Without verification (gate off) the typed number
          still reaches the hook and is saved as before. */}
      {phoneVerification === "inline" && (
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