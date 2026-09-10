"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, X } from "lucide-react";

import { PhoneMaskInput } from "@/shared/ui/PhoneMaskInput";
import { notify } from "@/shared/lib/notify";
import { sendCallRequest } from "../lib/callRequest";
import { useTranslation, translateWithFallback } from "../hooks/useTranslation";
import { generalKeys } from "../lib/translationsKeys/generalKeys";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";

export type BookACallAudience = "tenant" | "operator";

interface BookACallModalProps {
  isOpen: boolean;
  onClose: () => void;
  audience: BookACallAudience;
}

/**
 * One reason list, rendered identically on both landings — which landing the
 * visitor came from is recorded as the request's `source`, not by offering a
 * different set of options. The SLUG is what reaches the backend; the label is
 * whatever Localazy has for that language, and must never be sent.
 *
 * The order matches the positional `book.call.field1.optionN` keys, so
 * reordering here means renumbering there (and in the backend vocabulary).
 */
const REASONS = [
  { slug: "units_to_fill", fallback: "I have units to fill" },
  { slug: "see_demo", fallback: "I want to see a demo" },
  { slug: "pricing_and_terms", fallback: "I want to discuss pricing and terms" },
  { slug: "landlord_to_let", fallback: "I'm a landlord with a property to let" },
  { slug: "agent_partner", fallback: "I'm a letting agent looking to partner" },
  { slug: "connect_feed", fallback: "I want to connect a property feed" },
  { slug: "looking_for_home", fallback: "I'm looking for a home" },
  { slug: "finish_rental_cv", fallback: "Help me finish my Rental CV" },
  {
    slug: "question_about_property",
    fallback: "I have a question about a property",
  },
  { slug: "something_else", fallback: "Something else" },
] as const;

/**
 * How the visitor wants to be reached. This choice decides which contact field
 * the form shows below it — a call needs a phone number, `email` needs an
 * address — so exactly one of the two is ever visible, filled and required.
 *
 * Positional keys again (`book.call.field3.optionN`), in this order.
 */
const CONTACT_METHODS = [
  { slug: "voice_call", fallback: "Voice call" },
  { slug: "video_call", fallback: "Video call" },
  { slug: "email", fallback: "Email" },
] as const;

/** The one method that swaps the phone field for an email address. */
const EMAIL_METHOD = "email";

/**
 * Deliberately loose: a client-side check catches the typo the visitor can
 * fix, while the DTO's `@IsEmail` is what actually guards the data. A stricter
 * pattern here would only reject addresses the backend would have accepted.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_CLASSES =
  "w-full px-6 pt-6 pb-3 text-black text-base rounded-full border focus:ring-1 outline-none transition-all placeholder:text-gray-400";

export default function BookACallModal({
  isOpen,
  onClose,
  audience,
}: BookACallModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("GB");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState({
    reason: false,
    name: false,
    contactMethod: false,
    phone: false,
    email: false,
  });
  const [errors, setErrors] = useState({
    reason: "",
    name: "",
    contactMethod: "",
    phone: "",
    email: "",
  });

  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Which contact field is on screen, and therefore which one is required. */
  const wantsEmail = contactMethod === EMAIL_METHOD;

  const tr = (key: string, fallback: string) =>
    translateWithFallback(t, key, fallback);

  const reasonOptions = useMemo(
    () =>
      REASONS.map((option) => ({
        slug: option.slug,
        label: tr(
          generalKeys.bookACall.reason[
            option.slug as keyof typeof generalKeys.bookACall.reason
          ],
          option.fallback,
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const contactMethodOptions = useMemo(
    () =>
      CONTACT_METHODS.map((option) => ({
        slug: option.slug,
        label: tr(
          generalKeys.bookACall.contactMethod[
            option.slug as keyof typeof generalKeys.bookACall.contactMethod
          ],
          option.fallback,
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const resetFormState = () => {
    setReason("");
    setName("");
    setContactMethod("");
    setPhoneCountry("GB");
    setPhone("");
    setEmail("");
    setPreferredTime("");
    setNotes("");
    setTouched({
      reason: false,
      name: false,
      contactMethod: false,
      phone: false,
      email: false,
    });
    setErrors({
      reason: "",
      name: "",
      contactMethod: "",
      phone: "",
      email: "",
    });
    setIsReasonOpen(false);
    setIsMethodOpen(false);
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

    if (field === "reason" || field === "name" || field === "contactMethod") {
      if (!value.trim()) message = requiredMessage();
    }
    if (field === "phone") {
      const digits = value.replace(/\D/g, "");
      if (!digits) message = requiredMessage();
      else if (digits.length < 7)
        message = tr(generalKeys.bookACall.validation.phoneTooShort, "Too short");
    }
    if (field === "email") {
      if (!value.trim()) message = requiredMessage();
      else if (!EMAIL_PATTERN.test(value.trim()))
        message = tr(
          generalKeys.bookACall.validation.emailInvalid,
          "Enter a valid email address",
        );
    }

    setErrors((prev) => ({ ...prev, [field]: message }));
    return message;
  };

  /**
   * Only the contact field that is on screen is validated. Validating the
   * hidden one would block the submit on an error the visitor cannot see or
   * fix — the form would simply stop responding to the button.
   */
  const validateAll = () => {
    setTouched({
      reason: true,
      name: true,
      contactMethod: true,
      phone: true,
      email: true,
    });
    const e1 = validateField("reason", reason);
    const e2 = validateField("name", name);
    const e3 = validateField("contactMethod", contactMethod);
    const e4 = wantsEmail
      ? validateField("email", email)
      : validateField("phone", phone);
    return !(e1 || e2 || e3 || e4);
  };

  /**
   * Switching method retires the field it hides: its value would otherwise be
   * submitted invisibly, and its stale error would keep failing `validateAll`
   * for a field nobody can see.
   */
  const selectContactMethod = (slug: string) => {
    setContactMethod(slug);
    setIsMethodOpen(false);
    validateField("contactMethod", slug);

    if (slug === EMAIL_METHOD) {
      setPhone("");
      setPhoneCountry("GB");
      setErrors((prev) => ({ ...prev, phone: "" }));
      setTouched((prev) => ({ ...prev, phone: false }));
    } else {
      setEmail("");
      setErrors((prev) => ({ ...prev, email: "" }));
      setTouched((prev) => ({ ...prev, email: false }));
    }
  };

  /**
   * Feedback goes through the app-wide toaster, exactly as the booking-request
   * submit does (`PropertyDetailClient`: close the modal, then `notify.success`).
   *
   * Success closes the modal — `resetFormState` runs off `isOpen`, so the next
   * visitor gets a blank form. Failure deliberately does not: the values stay
   * on screen so a retry is one click, not a re-type.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsLoading(true);

    try {
      const { success } = await sendCallRequest({
        reason,
        name: name.trim(),
        contactMethod,
        // Exactly one contact channel goes on the wire — the same split the
        // DTO validates, so the hidden field can never leak into the payload.
        ...(wantsEmail
          ? { email: email.trim() }
          : { phone: { countryCode: phoneCountry, number: phone.trim() } }),
        ...(preferredTime.trim() ? { preferredTime: preferredTime.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        source: audience,
      });

      if (!success) {
        notify.error(
          tr(
            generalKeys.bookACall.notification.error,
            "Something went wrong. Please try again.",
          ),
        );
        return;
      }

      onClose();
      notify.success(
        tr(
          generalKeys.bookACall.notification.complete,
          "Thanks — we'll be in touch shortly.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedReasonLabel = reasonOptions.find(
    (option) => option.slug === reason,
  )?.label;

  const selectedMethodLabel = contactMethodOptions.find(
    (option) => option.slug === contactMethod,
  )?.label;

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
                  "Full name",
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

            {/* Preferred contact method — the switch that decides which
                contact field renders below. Same light-themed select as the
                reason field above. */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700 z-10">
                {tr(
                  generalKeys.bookACall.contactMethodLabel,
                  "Preferred contact method",
                )}
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsMethodOpen((open) => !open);
                  setIsReasonOpen(false);
                  setTouched((prev) => ({ ...prev, contactMethod: true }));
                }}
                aria-haspopup="listbox"
                aria-expanded={isMethodOpen}
                className={`${FIELD_CLASSES} ${borderFor("contactMethod")} flex items-center justify-between gap-3 text-left cursor-pointer bg-white`}
              >
                <span
                  className={selectedMethodLabel ? "text-black" : "text-gray-400"}
                >
                  {selectedMethodLabel ??
                    tr(
                      generalKeys.bookACall.contactMethodPlaceholder,
                      "Select a contact method",
                    )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isMethodOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isMethodOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsMethodOpen(false)}
                  />
                  <ul
                    role="listbox"
                    className="absolute top-full left-0 right-0 z-30 mt-2 rounded-3xl border border-gray-200 bg-white shadow-xl py-2"
                  >
                    {contactMethodOptions.map((option) => (
                      <li key={option.slug}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={contactMethod === option.slug}
                          onClick={() => selectContactMethod(option.slug)}
                          className={`w-full text-left px-6 py-3 text-sm transition-colors cursor-pointer ${
                            contactMethod === option.slug
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

              {errors.contactMethod && touched.contactMethod && (
                <p className="mt-1 ml-4 text-xs text-red-600">
                  {errors.contactMethod}
                </p>
              )}
            </div>

            {/* The contact field the method above chose. Email swaps the phone
                out rather than adding to it: the visitor gives us one way to
                reach them, and the backend stores exactly that one. */}
            {wantsEmail ? (
              <div className="relative">
                <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                  {tr(generalKeys.modalForm.emailLabel, "Email")}
                </label>
                <input
                  type="email"
                  name="email"
                  maxLength={254}
                  placeholder={tr(
                    generalKeys.modalForm.emailPlaceholder,
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
                  <p className="mt-1 ml-4 text-xs text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Phone — country selector plus mask, defaulting to GB.
                    Labelled from the profile settings keys, so the same field
                    reads the same way here and in the account form. */}
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
                    label={tr(wizardKeys.profile.phone, "Phone Number")}
                    required
                    onCountryChange={(code) => {
                      setPhoneCountry(code);
                      // The component clears the number on a country switch, so
                      // the old value's validity says nothing about the new field.
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
                  <p className="-mt-2 ml-4 text-xs text-red-600">
                    {errors.phone}
                  </p>
                )}
              </>
            )}

            {/* Preferred time — optional free text. Whatever the visitor types
                reaches the support inbox verbatim; there is no vocabulary to
                match, so nothing here is validated beyond a length cap. */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {tr(generalKeys.bookACall.preferredTimeLabel, "Preferred time")}
              </label>
              <input
                type="text"
                name="preferredTime"
                maxLength={120}
                placeholder={tr(
                  generalKeys.bookACall.preferredTimePlaceholder,
                  "Select a time",
                )}
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className={`${FIELD_CLASSES} border-gray-300 focus:ring-black`}
              />
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
                  "Add any details or questions about your call",
                )}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-6 pt-7 pb-3 text-black text-base rounded-3xl border border-gray-300 focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
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
