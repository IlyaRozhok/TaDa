"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import PhoneVerificationScreen from "@/app/components/phone-verification/PhoneVerificationScreen";
import { waitForSessionManager } from "@/app/components/providers/SessionManager";
import { selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";

/**
 * SMS phone verification. Reachable any time a signed-in user wants to
 * verify; while PHONE_VERIFICATION_REQUIRED is on, the gate sends every
 * unverified user here and nowhere else.
 *
 * Not wrapped in SimpleDashboardRouter on purpose: that router sends users
 * without preferences to onboarding, and verification comes first.
 */
export default function VerifyPhonePage() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    void waitForSessionManager().then(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (sessionReady && !isAuthenticated) router.replace("/app/auth");
  }, [sessionReady, isAuthenticated, router]);

  if (!sessionReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  return <PhoneVerificationScreen />;
}
