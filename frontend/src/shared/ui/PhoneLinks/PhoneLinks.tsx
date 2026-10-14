import React from "react";
import { MessageCircle, Phone } from "lucide-react";

import { formatPhoneForDisplay, phoneLinks } from "@/shared/lib/phone";

interface PhoneLinksProps {
  /** As stored: E.164, or a legacy value. */
  phone: string | null | undefined;
  /** Reads a legacy national value; E.164 ignores it. */
  country?: string | null;
  /** `dark` for the glass admin modals, `light` for white tables. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * A stored phone for staff: formatted for reading (UK nationally, others
 * internationally), dialable through `tel:`, and one tap to WhatsApp. A value
 * that is not a valid number is shown as stored, with no links — dialling a
 * truncated legacy number would reach a stranger.
 */
export default function PhoneLinks({ phone, country, tone = "light", className = "" }: PhoneLinksProps) {
  const text = formatPhoneForDisplay(phone, country);
  if (!text) return null;

  const links = phoneLinks(phone, country);
  const muted = tone === "dark" ? "text-white/60" : "text-gray-500";
  const link =
    tone === "dark"
      ? "text-white hover:text-white/80 underline-offset-2 hover:underline"
      : "text-black hover:text-gray-700 underline-offset-2 hover:underline";

  if (!links) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Phone className={`w-3.5 h-3.5 shrink-0 ${muted}`} />
        <span title="Not a valid number — check with the user">{text}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <a href={links.tel} className={`inline-flex items-center gap-2 ${link}`} title="Call">
        <Phone className={`w-3.5 h-3.5 shrink-0 ${muted}`} />
        {text}
      </a>
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-xs ${link}`}
        title="Open in WhatsApp"
      >
        <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${muted}`} />
        WhatsApp
      </a>
    </span>
  );
}
