import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/app/lib/siteMetadata";
import PhoneVerificationGate from "@/app/components/phone-verification/PhoneVerificationGate";
import "../globals.css";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Inert unless the backend reports the phone verification gate on. */}
      <PhoneVerificationGate />
      {children}
    </>
  );
}
