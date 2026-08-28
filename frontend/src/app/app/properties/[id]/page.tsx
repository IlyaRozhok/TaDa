import type { Metadata } from "next";
import { fetchPublicProperty } from "@/app/lib/serverApi";
import PropertyDetailClient from "./PropertyDetailClient";

/**
 * Server wrapper around the (client) property detail page. The interactive
 * page is untouched — this layer only gives crawlers and link previews what
 * a client component cannot: per-property <title>/description/OpenGraph via
 * generateMetadata, and a schema.org JSON-LD block. Data comes from the same
 * public endpoint the client uses, ISR-cached server-side for 5 minutes.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchPublicProperty(id);

  if (!property) {
    return { title: "Property | TaDa" };
  }

  const description =
    property.descriptions?.slice(0, 160) ||
    [
      property.bedrooms != null ? `${property.bedrooms} bed` : null,
      property.bathrooms != null ? `${property.bathrooms} bath` : null,
      property.address,
    ]
      .filter(Boolean)
      .join(" · ") ||
    "Rental property on TaDa";

  return {
    title: `${property.title} | TaDa`,
    description,
    alternates: { canonical: `/app/properties/${property.id}` },
    openGraph: {
      title: property.title,
      description,
      type: "website",
      // The stable proxy, NOT the photo URL itself: photos are 24-hour
      // presigned S3 URLs, and an unfurler rendering the preview later than
      // that would get a 403. Relative — resolved against metadataBase.
      images: property.photos?.length
        ? [`/api/og/property/${property.id}`]
        : undefined,
    },
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params;
  const property = await fetchPublicProperty(id);

  // The platform is London-only, so the offer currency is a constant until
  // the data model grows one (flagged in the audit).
  const canonicalUrl = property
    ? `https://ta-da.co/app/properties/${property.id}`
    : null;

  const jsonLd = property
    ? {
        "@context": "https://schema.org",
        // Multi-typed on purpose: Apartment carries the accommodation
        // semantics, Product legitimises `offers` — schema.org's Apartment
        // (a Place) has no offers property, and Google's Rich Results
        // silently drops pricing attached to it.
        "@type": ["Apartment", "Product"],
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: property.title,
        description: property.descriptions || undefined,
        numberOfBedrooms: property.bedrooms ?? undefined,
        floorSize:
          property.square_meters != null
            ? {
                "@type": "QuantitativeValue",
                value: property.square_meters,
                unitCode: "MTK",
              }
            : undefined,
        address: property.address
          ? {
              "@type": "PostalAddress",
              streetAddress: property.address,
              addressLocality: "London",
              addressCountry: "GB",
            }
          : undefined,
        // The stable proxy for the same 24-hour-presign reason as OpenGraph.
        image: property.photos?.length
          ? [`https://ta-da.co/api/og/property/${property.id}`]
          : undefined,
        ...(property.price != null
          ? {
              offers: {
                "@type": "Offer",
                price: property.price,
                priceCurrency: "GBP",
              },
            }
          : {}),
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
      <PropertyDetailClient />
    </>
  );
}
