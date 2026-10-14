"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { safeReturnPath } from "@/shared/lib/phoneVerification";
import { selectUser } from "@/store/slices/authSlice";
import { redirectAfterLogin } from "@/app/utils/simpleRedirect";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import { phoneVerificationKeys as K } from "@/app/lib/translationsKeys/phoneVerificationKeys";
import InlinePhoneVerification from "./InlinePhoneVerification";
import { usePhoneVerificationText } from "./usePhoneVerificationText";

/**
 * The standalone verification screen: where the gate sends an existing user
 * whose phone is unverified, and where "Change number" in the profile form
 * leads. New users verify inline in the onboarding form instead; both run the
 * same InlinePhoneVerification flow.
 */
export default function PhoneVerificationScreen() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const tx = usePhoneVerificationText();

  return (
    <div className="bg-white">
      {/* The onboarding header (logo, language, user menu with sign-out):
          verification is the first step of the same flow. */}
      <OnboardingHeader />

      {/* Mobile: exactly the visible viewport (dvh, not vh — 100vh is taller
          than the screen under the browser bars, which made the page scroll),
          content anchored under the header rather than centred, so opening
          the numeric keyboard shrinks the viewport without the heading, code
          box and actions jumping. Centred on larger screens. */}
      <main className="min-h-[100dvh] bg-white flex justify-center items-start sm:items-center px-4 pt-20 sm:pt-24 pb-6 overscroll-none">
        <div className="w-full max-w-md space-y-5 sm:space-y-6">
          <h1 className="text-center text-2xl sm:text-3xl font-semibold text-black">{tx(K.verify.title)}</h1>

          <InlinePhoneVerification
            // Always the entry step here, even for a verified user who came to
            // change their number: the screen exists to verify a number.
            verifiedPhone={null}
            initialPhone={user?.phone}
            // The flow renders the subtitle, swapping it when the code is sent.
            subtitleClassName="text-center text-gray-600"
            // A white page with no grey card: the fields keep their grey fill
            // at every width instead of turning white from sm.
            filled
            onVerified={async (result) => {
              // Came from "Change number" in a profile form: go back there.
              // Read from location rather than useSearchParams, which would
              // need its own Suspense boundary for one value read once.
              const returnTo = safeReturnPath(new URLSearchParams(window.location.search).get("return"));
              if (returnTo) {
                router.replace(returnTo);
                return;
              }
              await redirectAfterLogin(
                {
                  ...user,
                  phone: result.phone,
                  phone_country: result.phone_country,
                  phone_verified_at: result.phone_verified_at,
                  phone_verification_pending: false,
                },
                router,
              );
            }}
          />
        </div>
      </main>
    </div>
  );
}
