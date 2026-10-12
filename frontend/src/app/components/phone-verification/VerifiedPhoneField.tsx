"use client";

import React from "react";
import Link from "next/link";

import { formatPhoneForDisplay } from "@/shared/lib/phone";

interface VerifiedPhoneFieldProps {
  /** The verified number, E.164. */
  phone: string;
  label: string;
  /** "Change number" navigates here (the standalone verification screen)… */
  changeHref?: string;
  /** …or, inline, hands control back to the verification flow in place. */
  onChangeNumber?: () => void;
}

/**
 * A verified phone, read-only: shown in display format with "Verified ✓".
 * It changes only by verifying the new number — via the link or in place.
 */
export default function VerifiedPhoneField({ phone, label, changeHref, onChangeNumber }: VerifiedPhoneFieldProps) {
  const changeClass = "text-sm text-gray-700 underline-offset-2 hover:underline flex-shrink-0 cursor-pointer";

  return (
    <div className="relative w-full px-6 pt-8 pb-4 rounded-4xl bg-white border border-gray-200">
      <span className="absolute left-6 top-3 text-xs text-gray-600">{label}</span>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-gray-900 truncate" aria-readonly="true">
            {formatPhoneForDisplay(phone)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 flex-shrink-0">
            Verified ✓
          </span>
        </span>
        {onChangeNumber ? (
          <button type="button" onClick={onChangeNumber} className={changeClass}>
            Change number
          </button>
        ) : changeHref ? (
          <Link href={changeHref} className={changeClass}>
            Change number
          </Link>
        ) : null}
      </div>
    </div>
  );
}
