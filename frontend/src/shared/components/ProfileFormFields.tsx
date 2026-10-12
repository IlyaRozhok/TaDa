"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/app/hooks/useTranslation";
import { formatPhoneForDisplay } from "@/shared/lib/phone";
import { phoneVerificationHref } from "@/shared/lib/phoneVerification";
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
  dateOfBirthError,
  onInputChange,
  onPhoneChange,
  onDateChange,
  className = "",
}) => {
  const { t } = useTranslation();
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

      {/* Phone: a verified number is shown, not asked for again. It changes
          only by re-verifying, never inline. */}
      <div className="mb-6">
        {verifiedPhone ? (
          <div className="relative w-full px-6 pt-8 pb-4 rounded-4xl bg-white">
            <span className="absolute left-6 top-3 text-xs text-gray-600">
              {t(wizardKeys.profile.phone)}
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-gray-900 truncate" aria-readonly="true">
                  {formatPhoneForDisplay(verifiedPhone)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 flex-shrink-0">
                  Verified ✓
                </span>
              </span>
              <Link
                href={phoneVerificationHref(pathname)}
                className="text-sm text-gray-700 underline-offset-2 hover:underline flex-shrink-0"
              >
                Change number
              </Link>
            </div>
          </div>
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