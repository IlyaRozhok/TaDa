"use client";

import { useCallback } from "react";

import { translateWithFallback, useTranslation } from "@/app/hooks/useTranslation";
import { PHONE_VERIFICATION_FALLBACKS } from "@/app/lib/translationsKeys/phoneVerificationKeys";

/**
 * `tx(key)`: the Localazy value of a phone verification key, or its approved
 * English fallback while Localazy has not synced it — never the raw key.
 */
export function usePhoneVerificationText() {
  const { t } = useTranslation();
  return useCallback(
    (key: string) => translateWithFallback(t, key, PHONE_VERIFICATION_FALLBACKS[key] ?? key),
    [t],
  );
}
