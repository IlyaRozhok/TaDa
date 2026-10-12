"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";

import {
  PHONE_VERIFICATION_PATH,
  isPhoneVerificationExempt,
  isPhoneVerificationPending,
} from "@/shared/lib/phoneVerification";
import { selectUser } from "@/store/slices/authSlice";

/**
 * The browser half of the verification gate, mounted on every /app page.
 * It acts only on the backend's verdict (`phone_verification_pending` from
 * /auth/me), which is false unless PHONE_VERIFICATION_REQUIRED is on — so
 * with the flag off it never redirects anyone. The server guard is what
 * actually blocks: this only saves an unverified user a page of 403s.
 */
export default function PhoneVerificationGate() {
  const user = useSelector(selectUser);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isPhoneVerificationPending(user) && !isPhoneVerificationExempt(pathname)) {
      router.replace(PHONE_VERIFICATION_PATH);
    }
  }, [user, pathname, router]);

  return null;
}
