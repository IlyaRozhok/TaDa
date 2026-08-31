import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/siteUrl";
import HomePageClient from "./HomePageClient";

/**
 * Server wrapper around the (client) landing page — same pattern as
 * app/properties/[id]. The interactive page moved to HomePageClient untouched;
 * this layer only adds what a client component cannot export: the
 * self-referencing canonical and the site-wide Organization/WebSite JSON-LD.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The site-level identity graph. It belongs on the homepage only — the
// per-page Apartment/ApartmentComplex blocks on the detail routes describe
// individual listings and are unrelated to this.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "TA-DA",
      legalName: "TA-DA.ME LTD",
      url: SITE_URL,
      logo: `${SITE_URL}/landing-logo.svg`,
      sameAs: ["https://www.instagram.com/tada.london"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "TaDa",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      // No potentialAction/SearchAction: the catalogue at /app/units has no
      // public query parameter to point one at, and a wrong target is worse
      // than none.
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
