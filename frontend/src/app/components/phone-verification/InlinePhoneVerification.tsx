"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { PhoneMaskInput } from "@/shared/ui/PhoneMaskInput";
import { useTurnstile } from "@/shared/ui/Turnstile/useTurnstile";
import { parseStoredPhone } from "@/shared/lib/countries";
import { formatPhoneForDisplay, phoneErrorMessage, processPhone } from "@/shared/lib/phone";
import {
  OTP_LENGTH,
  countryNotAllowedMessage,
  formatCountdown,
  isCompleteOtp,
  isPhoneCountryAllowed,
  phoneVerificationError,
  sanitizeOtpInput,
} from "@/shared/lib/phoneVerification";
import {
  useGetPhoneVerificationConfigQuery,
  useSendPhoneCodeMutation,
  useVerifyPhoneCodeMutation,
  type VerifyPhoneCodeResponse,
} from "@/store/api/phoneVerification.api";
import { updateUser } from "@/store/slices/authSlice";
import VerifiedPhoneField from "./VerifiedPhoneField";

// TODO(localazy): the strings in this component (labels, buttons, hints,
// client-side errors) are hardcoded English on purpose for now — externalize
// them to Localazy keys when the verification flow is localized. Errors from
// the API arrive as English `message`s and need the same treatment.

type Step = "phone" | "code";

interface InlinePhoneVerificationProps {
  /** The user's verified number (E.164); shows the read-only verified state. */
  verifiedPhone: string | null;
  /** An unverified number already on the account, to pre-fill the field. */
  initialPhone?: string | null;
  phoneLabel?: string;
  /** Label of the send-code button. */
  sendLabel?: string;
  /** Called once the code is approved and the user in the store is updated. */
  onVerified?: (result: VerifyPhoneCodeResponse) => void;
  /** Reports the number as typed, for forms that also save it unverified. */
  onNumberChange?: (national: string, country: string) => void;
}

/**
 * Phone → SMS code → verified, all in one place: sending replaces the number
 * row with the code row in place, approving replaces it with the read-only
 * "Verified ✓" number. No route change, no overlay. Used inline by the
 * onboarding form and by the standalone /app/verify-phone screen, so the two
 * cannot diverge.
 *
 * Plain elements, not a <form>: it sits inside the onboarding form, and forms
 * do not nest. Enter submits the current step by hand.
 */
export default function InlinePhoneVerification({
  verifiedPhone,
  initialPhone,
  phoneLabel = "Phone Number",
  sendLabel = "Verify",
  onVerified,
  onNumberChange,
}: InlinePhoneVerificationProps) {
  const dispatch = useDispatch();

  const initial = useMemo(() => {
    const parsed = initialPhone ? parseStoredPhone(initialPhone) : null;
    return { country: parsed?.country.code ?? "GB", national: parsed?.nationalNumber ?? "" };
    // Only the first render's number matters: later updates must not wipe typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState<Step>("phone");
  // "Change number" on a verified phone reopens the flow in place.
  const [changing, setChanging] = useState(false);
  const [country, setCountry] = useState(initial.country);
  const [national, setNational] = useState(initial.national);
  const [sentTo, setSentTo] = useState<{ phone: string; country: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data: config } = useGetPhoneVerificationConfigQuery();
  const [sendPhoneCode, { isLoading: isSending }] = useSendPhoneCodeMutation();
  const [verifyPhoneCode, { isLoading: isVerifying }] = useVerifyPhoneCodeMutation();
  const { containerRef, getToken } = useTurnstile();

  const resendIn = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0;

  // Ticks only while a countdown is running.
  useEffect(() => {
    if (!resendAt || resendAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  const startCountdown = (seconds: number) => {
    setNow(Date.now());
    setResendAt(Date.now() + seconds * 1000);
  };

  /** Send (or resend) a code: validate here first, so nothing doomed reaches the API. */
  const sendCode = async () => {
    setError(null);
    const processed = processPhone(national, country);
    if (!processed.e164) {
      setError(phoneErrorMessage(national, country, { required: true }) ?? "Please enter a valid phone number");
      return;
    }
    if (!isPhoneCountryAllowed(processed.country, config?.allowedCountries)) {
      setError(countryNotAllowedMessage(processed.country));
      return;
    }

    let turnstileToken: string | undefined;
    try {
      turnstileToken = await getToken();
    } catch {
      setError("Please complete the security check and try again.");
      return;
    }

    try {
      const result = await sendPhoneCode({ phone: processed.e164, country, turnstileToken }).unwrap();
      setSentTo({ phone: result.phone, country: result.country });
      setCode("");
      setStep("code");
      startCountdown(result.resendAfterSeconds);
    } catch (err) {
      const problem = phoneVerificationError(err);
      setError(problem.message);
      if (problem.code === "RESEND_TOO_SOON" && problem.retryAfterSeconds) {
        startCountdown(problem.retryAfterSeconds);
        // A code went out a moment ago (another tab, a double tap): let them use it.
        if (!sentTo) setSentTo({ phone: processed.e164, country: processed.country ?? country });
        setStep("code");
      }
    }
  };

  const verify = async () => {
    if (!sentTo || !isCompleteOtp(code) || isVerifying) return;
    setError(null);
    try {
      const result = await verifyPhoneCode({ phone: sentTo.phone, code }).unwrap();
      dispatch(
        updateUser({
          phone: result.phone,
          phone_country: result.phone_country,
          phone_verified_at: result.phone_verified_at,
          phone_verification_pending: false,
        }),
      );
      setChanging(false);
      setStep("phone");
      setCode("");
      setResendAt(null);
      onVerified?.(result);
    } catch (err) {
      const problem = phoneVerificationError(err);
      setError(problem.message);
      if (problem.code === "TOO_MANY_ATTEMPTS" || problem.code === "CODE_EXPIRED") setCode("");
    }
  };

  const onEnter = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Inside the onboarding form, Enter must not submit the whole form.
      e.preventDefault();
      action();
    }
  };

  if (verifiedPhone && !changing) {
    return (
      <VerifiedPhoneField
        phone={verifiedPhone}
        label={phoneLabel}
        onChangeNumber={() => {
          setChanging(true);
          setStep("phone");
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <div onKeyDown={onEnter(() => void sendCode())}>
            <PhoneMaskInput
              className="rounded-4xl border border-gray-200"
              countryCode={country}
              value={national}
              label={phoneLabel}
              validate
              onCountryChange={(next) => {
                setCountry(next);
                setError(null);
                onNumberChange?.("", next);
              }}
              onChange={(value, detectedCountry) => {
                const nextNational = value ?? "";
                const nextCountry = detectedCountry ?? country;
                setNational(nextNational);
                if (detectedCountry) setCountry(detectedCountry);
                setError(null);
                onNumberChange?.(nextNational, nextCountry);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={isSending || resendIn > 0}
            className="w-full bg-black text-white rounded-full py-4 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? "Sending…" : resendIn > 0 ? `${sendLabel} in ${formatCountdown(resendIn)}` : sendLabel}
          </button>
          {changing && (
            <button
              type="button"
              onClick={() => {
                setChanging(false);
                setError(null);
              }}
              className="text-sm text-gray-700 underline-offset-2 hover:underline cursor-pointer"
            >
              Keep {formatPhoneForDisplay(verifiedPhone)}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Enter the 6-digit code we sent to {formatPhoneForDisplay(sentTo?.phone)}.
          </p>
          <input
            aria-label="Verification code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={OTP_LENGTH}
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(sanitizeOtpInput(e.target.value));
              setError(null);
            }}
            onKeyDown={onEnter(() => void verify())}
            placeholder="••••••"
            // Explicit text colour, as on every other input: inherited, the
            // value took body's --foreground, which turns light grey under
            // prefers-color-scheme: dark — unreadable on this white field.
            className="w-full text-center text-3xl tracking-[0.5em] font-semibold text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-4xl py-5 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="button"
            onClick={() => void verify()}
            disabled={!isCompleteOtp(code) || isVerifying}
            className="w-full bg-black text-white rounded-full py-4 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? "Verifying…" : "Confirm"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-gray-700 underline-offset-2 hover:underline cursor-pointer"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={resendIn > 0 || isSending}
              className="text-black font-medium underline-offset-2 hover:underline cursor-pointer disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendIn > 0 ? `Resend code in ${formatCountdown(resendIn)}` : "Resend code"}
            </button>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Invisible Turnstile widget; renders nothing while it is not configured. */}
      <div ref={containerRef} />
    </div>
  );
}
