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

export default function BuildingPage() {
  return <BuildingDetailClient />;
}
