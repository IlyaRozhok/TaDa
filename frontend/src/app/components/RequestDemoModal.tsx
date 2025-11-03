"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { sendDemoRequest } from "../lib/emailjs";
import { useTranslation } from "../hooks/useTranslation";
import { generalKeys } from "../lib/translationsKeys/generalKeys";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";

type ModalSource =
  | "tenant-contact"
  | "operator-request-demo"
  | "operator-spotlight";

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  landingType?: "operators" | "tenants";
  modalSource?: ModalSource;
}

export default function RequestDemoModal({
  isOpen,
  onClose,
  landingType = "operators",
  modalSource,
}: RequestDemoModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const resetFormState = () => {
    setFormData({ firstName: "", lastName: "", email: "", phone: "" });
    setTouched({
      firstName: false,
      lastName: false,
      email: false,
      phone: false,
    });
    setErrors({ firstName: "", lastName: "", email: "", phone: "" });
    setSubmitStatus("idle");
    setErrorMessage("");
    setIsLoading(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      resetFormState();
    }
  }, [isOpen]);

  const getModalTitle = (): string => {
    if (modalSource === "tenant-contact") {
      return t(generalKeys.modalForm.tenantTitle);
    } else if (modalSource === "operator-request-demo") {
      return t(operatorKeys.header.ctaBtn);
    } else if (modalSource === "operator-spotlight") {
      return t(generalKeys.modalForm.operatorTitle);
    }
    return landingType === "tenants"
      ? t(generalKeys.modalForm.tenantTitle)
      : t(generalKeys.modalForm.operatorTitle);
  };

  const getEmailSource = (): string => {
    if (modalSource === "tenant-contact") {
      return "Tenant";
    } else if (modalSource === "operator-request-demo") {
      return "Operator Request Demo";
    } else if (modalSource === "operator-spotlight") {
      return "Operator Spotlight Series";
    }
    return landingType === "tenants" ? "Tenant" : "Operator";
  };

  const getButtonText = (): string => {
    if (modalSource === "tenant-contact") {
      return t(generalKeys.modalForm.tenantTitle);
    } else if (modalSource === "operator-request-demo") {
      return t(operatorKeys.header.ctaBtn);
    } else if (modalSource === "operator-spotlight") {
      return t(generalKeys.modalForm.operatorTitle);
    }
    return landingType === "tenants"
      ? t(generalKeys.modalForm.tenantTitle)
      : t(generalKeys.modalForm.operatorTitle);
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name as keyof typeof touched]) {
      validateField(name as keyof typeof formData, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name as keyof typeof formData, value);
  };

  const validateField = (field: keyof typeof formData, value: string) => {
    let message = "";
    if (field === "firstName" || field === "lastName") {
      if (!value.trim()) message = "Required";
    }
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) message = "Required";
      else if (!emailRegex.test(value)) message = "Invalid email";
    }
    if (field === "phone") {
      const digits = value.replace(/\D/g, "");
      if (!digits) message = "Required";
      else if (digits.length < 7) message = "Too short";
    }
    setErrors((prev) => ({ ...prev, [field]: message }));
    return message;
  };

  const validateAll = () => {
    const nextTouched = {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    };
    setTouched(nextTouched);
    const e1 = validateField("firstName", formData.firstName);
    const e2 = validateField("lastName", formData.lastName);
    const e3 = validateField("email", formData.email);
    const e4 = validateField("phone", formData.phone);
    return !(e1 || e2 || e3 || e4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      return;
    }
    setIsLoading(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const result = await sendDemoRequest({
        ...formData,
        source: getEmailSource(),
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      setSubmitStatus("success");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);

      // Close modal after 5 seconds (2 seconds after message disappears)
      setTimeout(() => {
        onClose();
        setFormData({ firstName: "", lastName: "", email: "", phone: "" });
      }, 5000);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred"
      );

      // Hide error message after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle");
        setErrorMessage("");
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors z-10 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="px-10 pt-10 pb-2">
          <div className="">
            <div className="flex items-center mb-8">
              <img
                src="/black-logo.svg"
                alt="TADA Logo"
                className="w-[120px] cursor-pointer"
              />
            </div>
            <h2 className="md:text-3xl text-2xl font-bold text-gray-900 leading-tight">
              {getModalTitle()}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit} className="px-8 pb-10 pt-5">
          <div className="space-y-4">
            {/* First Name */}

            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {t(generalKeys.modalForm.firstNameLabel)}
              </label>
              <input
                type="text"
                name="firstName"
                placeholder={t(generalKeys.modalForm.firstNamePlaceholder)}
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={!!errors.firstName && touched.firstName}
                className={`w-full px-6 pt-6 pb-3 text-black text-base rounded-full border focus:ring-1 outline-none transition-all placeholder:text-gray-400 ${
                  errors.firstName && touched.firstName
                    ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-black"
                }`}
              />
              {errors.firstName && touched.firstName && (
                <p className="mt-1 ml-4 text-xs text-red-600">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {t(generalKeys.modalForm.lastNameLabel)}
              </label>
              <input
                type="text"
                name="lastName"
                placeholder={t(generalKeys.modalForm.lastNamePlaceholder)}
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={!!errors.lastName && touched.lastName}
                className={`w-full px-6 pt-6 pb-3 text-black text-base rounded-full border focus:ring-1 outline-none transition-all placeholder:text-gray-400 ${
                  errors.lastName && touched.lastName
                    ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-black"
                }`}
              />
              {errors.lastName && touched.lastName && (
                <p className="mt-1 ml-4 text-xs text-red-600">
                  {errors.lastName}
                </p>
              )}
            </div>
            {/* </div> */}

            {/* Email */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {t(generalKeys.modalForm.emailLabel)}
              </label>
              <input
                type="email"
                name="email"
                placeholder={t(generalKeys.modalForm.emailPlaceholder)}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={!!errors.email && touched.email}
                className={`w-full px-6 pt-6 pb-3 text-base text-black rounded-full border focus:ring-1 outline-none transition-all placeholder:text-gray-400 ${
                  errors.email && touched.email
                    ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-black"
                }`}
              />
              {errors.email && touched.email && (
                <p className="mt-1 ml-4 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="relative">
              <label className="absolute left-6 top-2 text-xs font-medium text-gray-700">
                {t(generalKeys.modalForm.phoneLabel)}
              </label>
              <input
                type="tel"
                name="phone"
                placeholder={t(generalKeys.modalForm.phonePlaceholder)}
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={!!errors.phone && touched.phone}
                className={`w-full px-6 pt-6 pb-3 text-black text-base rounded-full border focus:ring-1 outline-none transition-all placeholder:text-gray-400 ${
                  errors.phone && touched.phone
                    ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-black"
                }`}
              />
              {errors.phone && touched.phone && (
                <p className="mt-1 ml-4 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {submitStatus === "success" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm animate-in fade-in duration-300">
              Your request sent successfully! We&apos;ll contact you soon.
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm animate-in fade-in duration-300">
              ❌ {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || submitStatus === "success"}
            className="w-full mt-8 bg-black text-white px-6 py-4 rounded-full text-base font-semibold hover:bg-black/30 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
          >
            {isLoading
              ? "Sending..."
              : submitStatus === "success"
              ? "Sent!"
              : getButtonText()}
          </button>
        </form>
      </div>
    </div>
  );
}
