"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { PhoneMaskInput } from "@/shared/ui/PhoneMaskInput";
import { sendCallRequest } from "../lib/callRequest";
import { useTranslation, translateWithFallback } from "../hooks/useTranslation";
import { generalKeys } from "../lib/translationsKeys/generalKeys";
import { tenantKeys } from "../lib/translationsKeys/tenantTranslationKeys";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";

export type BookACallAudience = "tenant" | "operator";

interface BookACallModalProps {
  isOpen: boolean;
  onClose: () => void;
  audience: BookACallAudience;
}

/**
 * The reason lists differ per landing, so the slug/fallback pairs live next to
 * the key that translates them. The SLUG is what reaches the backend — the
 * label is whatever Localazy has for that language, and must never be sent.
 */
const TENANT_REASONS = [
  { slug: "help_find_home", fallback: "Help me find a home" },
  { slug: "finish_rental_cv", fallback: "Help me finish my Rental CV" },
  {
    slug: "question_about_property",
    fallback: "I have a question about a property",
  },
  { slug: "something_else", fallback: "Something else" },
] as const;

const OPERATOR_REASONS = [
  { slug: "units_to_fill", fallback: "I have units to fill" },
  { slug: "see_demo", fallback: "I want to see a demo" },
  { slug: "pricing_and_terms", fallback: "I want to discuss pricing and terms" },
  { slug: "landlord_to_let", fallback: "I'm a landlord with a property to let" },
  { slug: "agent_partner", fallback: "I'm a letting agent looking to partner" },
  { slug: "connect_feed", fallback: "I want to connect a property feed" },
  { slug: "looking_for_home", fallback: "I'm looking for a home" },
  { slug: "something_else", fallback: "Something else" },
] as const;

const PREFERRED_TIMES = [
  { slug: "morning", key: generalKeys.bookACall.time.morning, fallback: "Morning" },
  {
    slug: "afternoon",
    key: generalKeys.bookACall.time.afternoon,
    fallback: "Afternoon",
  },
  { slug: "evening", key: generalKeys.bookACall.time.evening, fallback: "Evening" },
  { slug: "asap", key: generalKeys.bookACall.time.asap, fallback: "ASAP" },
] as const;

/** "asap" means "call me now" — pairing it with a time of day is incoherent. */
const ASAP = "asap";

const FIELD_CLASSES =
  "w-full px-6 pt-6 pb-3 text-black text-base rounded-full border focus:ring-1 outline-none transition-all placeholder:text-gray-400";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookACallModal({
  isOpen,
  onClose,
  audience,
}: BookACallModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("GB");
  const [phone, setPhone] = useState("");
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState({
    reason: false,
    name: false,
    email: false,
    phone: false,
  });
  const [errors, setErrors] = useState({
    reason: "",
    name: "",
    email: "",
    phone: "",
  });

  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const tr = (key: string, fallback: string) =>
    translateWithFallback(t, key, fallback);

  // Same audience switch the landing sections use, so the modal never has to
  // be told which key set to read — only which landing opened it.
  const reasonOptions = useMemo(() => {
    const source =
      audience === "tenant"
        ? { list: TENANT_REASONS, keys: tenantKeys.bookACall.reason }
        : { list: OPERATOR_REASONS, keys: operatorKeys.bookACall.reason };

    return source.list.map((option) => ({
      slug: option.slug,
      label: tr(
        (source.keys as Record<string, string>)[option.slug],
        option.fallback,
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, t]);

  const resetFormState = () => {
    setReason("");
    setName("");
    setEmail("");
    setPhoneCountry("GB");
    setPhone("");
    setPreferredTimes([]);
    setNotes("");
    setTouched({ reason: false, name: false, email: false, phone: false });
    setErrors({ reason: "", name: "", email: "", phone: "" });
    setIsReasonOpen(false);
    setIsTimeOpen(false);
    setSubmitStatus("idle");
    setErrorMessage("");
    setIsLoading(false);
  };

  // Closing wipes the form: the modal is mounted for the page's whole life, so
  // without this a visitor who closes it mid-typing reopens someone else's
  // half-filled request.
  useEffect(() => {
    if (!isOpen) resetFormState();
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleBackdropClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleBackdropClick);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleBackdropClick);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const requiredMessage = () =>
    tr(generalKeys.bookACall.validation.required, "Required");

  const validateField = (
    field: keyof typeof errors,
    value: string,
  ): string => {
    let message = "";

    if (field === "reason" || field === "name") {
      if (!value.trim()) message = requiredMessage();
    }
    if (field === "email") {
      if (!value.trim()) message = requiredMessage();
      else if (!EMAIL_REGEX.test(value.trim()))
        message = tr(
          generalKeys.bookACall.validation.invalidEmail,
          "Invalid email",
        );
    }
    if (field === "phone") {
      const digits = value.replace(/\D/g, "");
      if (!digits) message = requiredMessage();
      else if (digits.length < 7)
        message = tr(generalKeys.bookACall.validation.phoneTooShort, "Too short");
    }

    setErrors((prev) => ({ ...prev, [field]: message }));
    return message;
  };

  const validateAll = () => {
    setTouched({ reason: true, name: true, email: true, phone: true });
    const e1 = validateField("reason", reason);
    const e2 = validateField("name", name);
    const e3 = validateField("email", email);
    const e4 = validateField("phone", phone);
    return !(e1 || e2 || e3 || e4);
  };

  /**
   * ASAP is mutually exclusive with the three times of day, in both
   * directions: picking it clears them, and picking any of them clears it.
   */
  const togglePreferredTime = (slug: string) => {
    setPreferredTimes((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (slug === ASAP) return [ASAP];
      return [...prev.filter((s) => s !== ASAP), slug];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsLoading(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const result = await sendCallRequest({
        reason,
        name: name.trim(),
        email: email.trim(),
        phone: { countryCode: phoneCountry, number: phone.trim() },
        ...(preferredTimes.length ? { preferredTimes } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        source: audience,
      });

      if (!result.success) throw new Error(result.message);

      // Left standing until the visitor closes the modal: the previous form
      // hid its confirmation on a timer, so anyone who looked away never
      // learned whether the request went through.
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedReasonLabel = reasonOptions.find(
    (option) => option.slug === reason,
  )?.label;

  const selectedTimeLabels = PREFERRED_TIMES.filter((option) =>
    preferredTimes.includes(option.slug),
  ).map((option) => tr(option.key, option.fallback));

  const borderFor = (field: keyof typeof errors) =>
    errors[field] && touched[field]
      ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500"
      : "border-gray-300 focus:ring-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors z-10 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="px-10 pt-10 pb-2">
          <div className="flex items-center mb-8">
            <img
              src="/black-logo.svg"
              alt="TADA Logo"
              className="w-[120px]"
            />
          </div>
          <h2 className="md:text-3xl text-2xl font-bold text-gray-900 leading-tight">
            {tr(generalKeys.bookACall.title, "Book a call")}
          </h2>
          <p className="mt-2 text-gray-600 text-base">
            {tr(
              generalKeys.bookACall.subtitle,
              "Tell us what you'd like to cover",
            )}
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="px-8 pb-10 pt-5">
          <div className="space-y-4">
            {/* Reason — light-themed single select. The shared
                SingleSelectDropdown is dark-glass and parent-controlled, so it
                cannot wear this modal's white rounded-full field. */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700 z-10">
                {tr(generalKeys.bookACall.reasonLabel, "Reason for your call")}
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsReasonOpen((open) => !open);
                  setIsTimeOpen(false);
                  setTouched((prev) => ({ ...prev, reason: true }));
                }}
                aria-haspopup="listbox"
                aria-expanded={isReasonOpen}
                className={`${FIELD_CLASSES} ${borderFor("reason")} flex items-center justify-between gap-3 text-left cursor-pointer bg-white`}
              >
                <span
                  className={selectedReasonLabel ? "text-black" : "text-gray-400"}
                >
                  {selectedReasonLabel ??
                    tr(
                      generalKeys.bookACall.reasonPlaceholder,
                      "Select a reason",
                    )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isReasonOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isReasonOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsReasonOpen(false)}
                  />
                  <ul
                    role="listbox"
                    className="absolute top-full left-0 right-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-xl py-2"
                  >
                    {reasonOptions.map((option) => (
                      <li key={option.slug}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={reason === option.slug}
                          onClick={() => {
                            setReason(option.slug);
                            setIsReasonOpen(false);
                            validateField("reason", option.slug);
                          }}
                          className={`w-full text-left px-6 py-3 text-sm transition-colors cursor-pointer ${
                            reason === option.slug
                              ? "bg-gray-100 text-black font-medium"
                              : "text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {errors.reason && touched.reason && (
                <p className="mt-1 ml-4 text-xs text-red-600">{errors.reason}</p>
              )}
            </div>

            {/* Name */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {tr(generalKeys.bookACall.nameLabel, "Name")}
              </label>
              <input
                type="text"
                name="name"
                placeholder={tr(
                  generalKeys.bookACall.namePlaceholder,
                  "Your full name",
                )}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) validateField("name", e.target.value);
                }}
                onBlur={(e) => {
                  setTouched((prev) => ({ ...prev, name: true }));
                  validateField("name", e.target.value);
                }}
                required
                aria-invalid={!!errors.name && touched.name}
                className={`${FIELD_CLASSES} ${borderFor("name")}`}
              />
              {errors.name && touched.name && (
                <p className="mt-1 ml-4 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {tr(generalKeys.bookACall.emailLabel, "Email")}
              </label>
              <input
                type="email"
                name="email"
                placeholder={tr(
                  generalKeys.bookACall.emailPlaceholder,
                  "you@example.com",
                )}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) validateField("email", e.target.value);
                }}
                onBlur={(e) => {
                  setTouched((prev) => ({ ...prev, email: true }));
                  validateField("email", e.target.value);
                }}
                required
                aria-invalid={!!errors.email && touched.email}
                className={`${FIELD_CLASSES} ${borderFor("email")}`}
              />
              {errors.email && touched.email && (
                <p className="mt-1 ml-4 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone — country selector plus mask, defaulting to GB. */}
            <div
              className={`rounded-4xl border transition-all ${
                errors.phone && touched.phone
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <PhoneMaskInput
                countryCode={phoneCountry}
                value={phone}
                label={tr(generalKeys.bookACall.phoneLabel, "Phone Number")}
                placeholder={tr(generalKeys.bookACall.phonePlaceholder, "")}
                required
                onCountryChange={(code) => {
                  setPhoneCountry(code);
                  // The component clears the number on a country switch, so the
                  // old value's validity says nothing about the new field.
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                onChange={(value) => {
                  const next = value ?? "";
                  setPhone(next);
                  if (touched.phone) validateField("phone", next);
                }}
              />
            </div>
            {errors.phone && touched.phone && (
              <p className="-mt-2 ml-4 text-xs text-red-600">{errors.phone}</p>
            )}

            {/* Preferred time — optional multiselect. */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700 z-10">
                {tr(generalKeys.bookACall.preferredTimeLabel, "Preferred time")}
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsTimeOpen((open) => !open);
                  setIsReasonOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={isTimeOpen}
                className={`${FIELD_CLASSES} border-gray-300 focus:ring-black flex items-center justify-between gap-3 text-left cursor-pointer bg-white`}
              >
                <span
                  className={
                    selectedTimeLabels.length ? "text-black" : "text-gray-400"
                  }
                >
                  {selectedTimeLabels.length
                    ? selectedTimeLabels.join(", ")
                    : tr(
                        generalKeys.bookACall.preferredTimePlaceholder,
                        "Select a time",
                      )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isTimeOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTimeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsTimeOpen(false)}
                  />
                  <ul
                    role="listbox"
                    aria-multiselectable
                    className="absolute top-full left-0 right-0 z-30 mt-2 rounded-3xl border border-gray-200 bg-white shadow-xl py-2"
                  >
                    {PREFERRED_TIMES.map((option) => {
                      const selected = preferredTimes.includes(option.slug);
                      return (
                        <li key={option.slug}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => togglePreferredTime(option.slug)}
                            className={`w-full flex items-center justify-between px-6 py-3 text-sm transition-colors cursor-pointer ${
                              selected
                                ? "bg-gray-100 text-black font-medium"
                                : "text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            <span>{tr(option.key, option.fallback)}</span>
                            {selected && <Check className="w-4 h-4" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {tr(generalKeys.bookACall.notesLabel, "Notes for your request")}
              </label>
              <textarea
                name="notes"
                rows={3}
                maxLength={2000}
                placeholder={tr(
                  generalKeys.bookACall.notesPlaceholder,
                  "Anything else we should know?",
                )}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-6 pt-7 pb-3 text-black text-base rounded-3xl border border-gray-300 focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>

          {submitStatus === "success" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm">
              {tr(
                generalKeys.bookACall.success,
                "Your request was sent successfully! We'll contact you soon.",
              )}
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {errorMessage ||
                tr(
                  generalKeys.bookACall.error,
                  "Something went wrong — please try again.",
                )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || submitStatus === "success"}
            className="w-full mt-8 bg-black text-white px-6 py-4 rounded-full text-base font-semibold hover:bg-black/30 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
          >
            {isLoading
              ? tr(generalKeys.bookACall.submitting, "Sending...")
              : tr(generalKeys.bookACall.submit, "Send request")}
          </button>
        </form>
      </div>
    </div>
  );
}
