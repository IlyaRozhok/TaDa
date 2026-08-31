import type { Metadata } from "next";

// The terms page itself is a client component (it reads translations), so its
// metadata lives on the segment layout — same arrangement as app/units.
export const metadata: Metadata = {
  title: "Terms of Use | TaDa",
  description:
    "The terms governing use of the TaDa rental platform by tenants, landlords and operators.",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
