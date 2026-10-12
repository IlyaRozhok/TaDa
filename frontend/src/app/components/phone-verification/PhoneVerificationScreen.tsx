"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

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
} from "@/store/api/phoneVerification.api";
import { logout, selectUser, updateUser } from "@/store/slices/authSlice";
import { authAPI } from "@/app/lib/api";
import { redirectAfterLogin } from "@/app/utils/simpleRedirect";

type Step = "phone" | "code";

/**
 * Phone entry → SMS code → verified. Shown on its own route and, while the
 * gate is on, the only page an unverified user can reach. Messages are
 * English, as the spec fixes them; most come straight from the API.
 */
export default function PhoneVerificationScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectUser);

  // Pre-fill from the number already on the account, when there is one.
  const initial = useMemo(() => {
    const parsed = user?.phone ? parseStoredPhone(user.phone) : null;
    return { country: parsed?.country.code ?? "GB", national: parsed?.nationalNumber ?? "" };
    // Only the first render's user matters: later updates must not wipe typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState<Step>("phone");
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
    if (!sentTo || !isCompleteOtp(code)) return;
    setError(null);
    try {
      const result = await verifyPhoneCode({ phone: sentTo.phone, code }).unwrap();
      const verifiedUser = {
        ...user,
        phone: result.phone,
        phone_country: result.phone_country,
        phone_verified_at: result.phone_verified_at,
        phone_verification_pending: false,
      };
      dispatch(updateUser(verifiedUser));
      await redirectAfterLogin(verifiedUser, router);
    } catch (err) {
      const problem = phoneVerificationError(err);
      setError(problem.message);
      if (problem.code === "TOO_MANY_ATTEMPTS" || problem.code === "CODE_EXPIRED") setCode("");
    }
  };

  const signOut = async () => {
    try {
      await authAPI.logout();
    } finally {
      dispatch(logout());
      router.replace("/");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-black">Verify your phone</h1>
          <p className="text-gray-600">
            {step === "phone"
              ? "We'll text you a 6-digit code to confirm your mobile number."
              : `Enter the 6-digit code we sent to ${formatPhoneForDisplay(sentTo?.phone)}.`}
          </p>
        </div>

        {step === "phone" ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <PhoneMaskInput
              countryCode={country}
              value={national}
              label="Mobile number"
              required
              validate
              onCountryChange={(code) => {
                setCountry(code);
                setError(null);
              }}
              onChange={(value, detectedCountry) => {
                setNational(value ?? "");
                if (detectedCountry) setCountry(detectedCountry);
                setError(null);
              }}
            />
            <button
              type="submit"
              disabled={isSending || resendIn > 0}
              className="w-full bg-black text-white rounded-full py-4 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending…" : resendIn > 0 ? `Send code in ${formatCountdown(resendIn)}` : "Send code"}
            </button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
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
              placeholder="••••••"
              className="w-full text-center text-3xl tracking-[0.5em] font-semibold bg-white rounded-4xl py-5 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={!isCompleteOtp(code) || isVerifying}
              className="w-full bg-black text-white rounded-full py-4 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying…" : "Verify"}
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
          </form>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        {/* Invisible Turnstile widget; renders nothing while it is not configured. */}
        <div ref={containerRef} />

        <p className="text-center text-sm text-gray-500">
          <button type="button" onClick={() => void signOut()} className="underline-offset-2 hover:underline cursor-pointer">
            Sign out
          </button>
        </p>
      </div>
    </main>
  );
}
