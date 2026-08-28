import type { Metadata } from "next";
import { fetchPublicBuilding } from "@/app/lib/serverApi";
import BuildingDetailClient from "./BuildingDetailClient";

/**
 * Server wrapper around the (client) building page — same pattern as
 * properties/[id]: the interactive page is untouched, this layer only adds
 * per-building metadata for crawlers and link previews.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const building = await fetchPublicBuilding(id);

  if (!building?.name) {
    return { title: "Building | TaDa" };
  }

  const description =
    building.descriptions?.slice(0, 160) ||
    [building.name, building.address].filter(Boolean).join(" · ");

  return {
    title: `${building.name} | TaDa`,
    description,
    alternates: { canonical: `/app/buildings/${building.id}` },
    openGraph: {
      title: building.name,
      description,
      type: "website",
    },
  };
}

export default async function BuildingPage({ params }: PageProps) {
  const { id } = await params;
  // Deduplicated with the generateMetadata fetch by Next's request memoization.
  const building = await fetchPublicBuilding(id);

  const canonicalUrl = building
    ? `https://ta-da.co/app/buildings/${building.id}`
    : null;

  const jsonLd = building?.name
    ? {
        "@context": "https://schema.org",
        "@type": "ApartmentComplex",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: building.name,
        description: building.descriptions || undefined,
        address: building.address
          ? {
              "@type": "PostalAddress",
              streetAddress: building.address,
              addressLocality: "London",
              addressCountry: "GB",
            }
          : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BuildingDetailClient />
    </>
  );
}
