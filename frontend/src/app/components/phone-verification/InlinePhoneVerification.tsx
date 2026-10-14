"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";

import { PhoneMaskInput } from "@/shared/ui/PhoneMaskInput";
import { useTurnstile } from "@/shared/ui/Turnstile/useTurnstile";
import { parseStoredPhone } from "@/shared/lib/countries";
import { notify } from "@/shared/lib/notify";
import { formatPhoneForDisplay, phoneValidationIssue, processPhone } from "@/shared/lib/phone";
import {
  OTP_LENGTH,
  formatCountdown,
  isCompleteOtp,
  isPhoneCountryAllowed,
  phoneIssueKey,
  phoneVerificationProblem,
  sanitizeOtpInput,
} from "@/shared/lib/phoneVerification";
import { phoneVerificationKeys as K } from "@/app/lib/translationsKeys/phoneVerificationKeys";
import {
  useGetPhoneVerificationConfigQuery,
  useSendPhoneCodeMutation,
  useVerifyPhoneCodeMutation,
  type VerifyPhoneCodeResponse,
} from "@/store/api/phoneVerification.api";
import { updateUser } from "@/store/slices/authSlice";
import VerifiedPhoneField from "./VerifiedPhoneField";
import { usePhoneVerificationText } from "./usePhoneVerificationText";

type Step = "phone" | "code";

interface InlinePhoneVerificationProps {
  /** The user's verified number (E.164); shows the read-only verified state. */
  verifiedPhone: string | null;
  /** An unverified number already on the account, to pre-fill the field. */
  initialPhone?: string | null;
  /** Classes of the subtitle line (centred on the standalone screen). */
  subtitleClassName?: string;
  /** Called once the code is approved and the user in the store is updated. */
  onVerified?: (result: VerifyPhoneCodeResponse) => void;
  /** Reports the number as typed, for forms that also save it unverified. */
  onNumberChange?: (national: string, country: string) => void;
  /**
   * Where the step's primary button (Send code, then Confirm) renders. The
   * onboarding form passes a slot at its very bottom, by its own Next
   * button; the phone row and the code box still swap in place up here.
   * Without it the button sits right under the field (standalone screen).
   */
  actionContainer?: Element | null;
  /**
   * Outline the phone field and the code box: for a plain white page (the
   * standalone screen), where the fields' shared fill would not show. In the
   * onboarding form's grey card they stay like the other fields.
   */
  outlined?: boolean;
}

/**
 * Phone → SMS code → verified, all in one place: sending replaces the number
 * row with the code row in place (and the subtitle with the code subtitle),
 * approving replaces it with the read-only "Verified" number. No route
 * change, no overlay. Used inline by the onboarding form and by the
 * standalone /app/verify-phone screen, so the two cannot diverge.
 *
 * Every visible text is a translation key (phoneVerificationKeys); errors —
 * the client's checks and the API's stable codes alike — are mapped to keys,
 * so no server wording reaches the screen.
 *
 * Plain elements, not a <form>: it sits inside the onboarding form, and forms
 * do not nest. Enter submits the current step by hand.
 */
export default function InlinePhoneVerification({
  verifiedPhone,
  initialPhone,
  subtitleClassName = "text-sm text-gray-600",
  onVerified,
  onNumberChange,
  actionContainer,
  outlined = false,
}: InlinePhoneVerificationProps) {
  const dispatch = useDispatch();
  const tx = usePhoneVerificationText();
  const subtitleId = useId();

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
  /** The translation key of the error on screen, never its text. */
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data: config } = useGetPhoneVerificationConfigQuery();
  const [sendPhoneCode, { isLoading: isSending }] = useSendPhoneCodeMutation();
  const [verifyPhoneCode, { isLoading: isVerifying }] = useVerifyPhoneCodeMutation();
  const { containerRef, getToken } = useTurnstile();

  const resendIn = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0;
  const error = errorKey ? tx(errorKey) : null;

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Focus the code box when it appears without letting the browser scroll
  // the page for the keyboard (autoFocus did, which jumped the screen on
  // mobile); only bring it into view if it is actually off-screen — as at
  // the bottom of the onboarding form.
  useEffect(() => {
    if (step !== "code") return;
    const input = codeInputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    input.scrollIntoView({ block: "nearest" });
  }, [step]);

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
    setErrorKey(null);
    const isResend = step === "code";
    const processed = processPhone(national, country);
    if (!processed.e164) {
      setErrorKey(phoneIssueKey(phoneValidationIssue(national, country, { required: true }) ?? "INVALID"));
      return;
    }
    if (!isPhoneCountryAllowed(processed.country, config?.allowedCountries)) {
      setErrorKey(K.error.countryUnsupported);
      return;
    }

    let turnstileToken: string | undefined;
    try {
      turnstileToken = await getToken();
    } catch {
      setErrorKey(K.commonErrorNetwork);
      return;
    }

    try {
      const result = await sendPhoneCode({ phone: processed.e164, country, turnstileToken }).unwrap();
      setSentTo({ phone: result.phone, country: result.country });
      setCode("");
      setStep("code");
      startCountdown(result.resendAfterSeconds);
      if (isResend) notify.success(tx(K.code.sent));
    } catch (err) {
      const problem = phoneVerificationProblem(err, "send");
      setErrorKey(problem.key);
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
    setErrorKey(null);
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
      notify.success(tx(K.code.success));
      onVerified?.(result);
    } catch (err) {
      const problem = phoneVerificationProblem(err, "verify");
      setErrorKey(problem.key);
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
        onChangeNumber={() => {
          setChanging(true);
          setStep("phone");
          setErrorKey(null);
        }}
      />
    );
  }

  /** "Resend code in" + the countdown as its own element, or the active send label. */
  const resendLabel =
    resendIn > 0 ? (
      <>
        {tx(K.code.resendIn)} <span className="tabular-nums">{formatCountdown(resendIn)}</span>
      </>
    ) : (
      tx(K.verify.sendCode)
    );

  const actionClass =
    "w-full bg-black text-white rounded-full py-4 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sendButton = (
    <button type="button" onClick={() => void sendCode()} disabled={isSending || resendIn > 0} className={actionClass}>
      {isSending ? tx(K.verify.sending) : resendLabel}
    </button>
  );
  const confirmButton = (
    <button type="button" onClick={() => void verify()} disabled={!isCompleteOtp(code) || isVerifying} className={actionClass}>
      {isVerifying ? tx(K.code.verifying) : tx(K.code.confirm)}
    </button>
  );
  /** The primary action, in the caller's slot at the bottom of the form, or here. */
  const placeAction = (button: React.ReactElement) =>
    actionContainer ? createPortal(button, actionContainer) : button;

  return (
    <div className="space-y-4">
      {/* One subtitle, replaced (not stacked) once the code is sent. */}
      <p id={subtitleId} className={subtitleClassName}>
        {tx(step === "phone" ? K.verify.subtitle : K.code.subtitle)}
        {/* The number the code went to, after the text rather than inside it:
            the translated copy carries no substitutions. */}
        {step === "code" && sentTo && (
          <>
            {" "}
            <span dir="ltr" className="font-medium text-gray-900 whitespace-nowrap">
              {formatPhoneForDisplay(sentTo.phone, sentTo.country)}
            </span>
          </>
        )}
      </p>

      {step === "phone" ? (
        <>
          <div onKeyDown={onEnter(() => void sendCode())}>
            <PhoneMaskInput
              countryCode={country}
              value={national}
              label={tx(K.verify.numberLabel)}
              // One error slot under the field: the API's or the field's own
              // check, translated — never both, never inside the frame.
              error={error ?? undefined}
              validate
              issueMessage={(issue) => tx(phoneIssueKey(issue))}
              reserveErrorSpace
              outlined={outlined}
              onCountryChange={(next) => {
                setCountry(next);
                setErrorKey(null);
                onNumberChange?.("", next);
              }}
              onChange={(value, detectedCountry) => {
                const nextNational = value ?? "";
                const nextCountry = detectedCountry ?? country;
                setNational(nextNational);
                if (detectedCountry) setCountry(detectedCountry);
                setErrorKey(null);
                onNumberChange?.(nextNational, nextCountry);
              }}
            />
          </div>
          {placeAction(sendButton)}
        </>
      ) : (
        <>
          {/* The code and its error, together: the error sits below the
              box with clear space, never inside or over it. */}
          <div>
            <input
              aria-labelledby={subtitleId}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "otp-error" : undefined}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={OTP_LENGTH}
              ref={codeInputRef}
              value={code}
              onChange={(e) => {
                setCode(sanitizeOtpInput(e.target.value));
                setErrorKey(null);
              }}
              onKeyDown={onEnter(() => void verify())}
              placeholder="••••••"
              // Explicit text colour, as on every other input: inherited, the
              // value took body's --foreground, which turns light grey under
              // prefers-color-scheme: dark — unreadable on this white field.
              // The form fields' shared look, like the phone field it replaces.
              className={`w-full text-center text-3xl tracking-[0.5em] font-semibold text-gray-900 placeholder-gray-400 bg-gray-50 sm:bg-white border-0 rounded-4xl py-5 focus:outline-none ${
                error ? "ring-1 ring-red-400 focus:ring-red-500" : outlined ? "ring-1 ring-gray-300" : ""
              }`}
            />
            {/* Always there, empty until needed: the error appearing does
                not shift the buttons below. */}
            <p id="otp-error" role="alert" className="mt-3 px-6 text-sm leading-5 min-h-5 text-red-600">
              {error}
            </p>
          </div>
          {placeAction(confirmButton)}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setErrorKey(null);
              }}
              className="text-gray-700 underline-offset-2 hover:underline cursor-pointer"
            >
              {tx(K.code.changeNumber)}
            </button>
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={resendIn > 0 || isSending}
              className="text-black font-medium underline-offset-2 hover:underline cursor-pointer disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
            >
              {isSending ? tx(K.verify.sending) : resendLabel}
            </button>
          </div>
        </>
      )}

      {/* Invisible Turnstile widget; takes no space while it renders nothing. */}
      <div ref={containerRef} className="empty:hidden" />
    </div>
  );
}
