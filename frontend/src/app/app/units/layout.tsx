import type { Metadata } from "next";

// The public catalogue is the highest-priority page in the sitemap; the page
// itself is a client component, so its metadata lives on the segment layout.
export const metadata: Metadata = {
  title: "Browse rental properties in London | TaDa",
  description:
    "Rental homes from verified operators and landlords across London — ranked by how well they match your preferences.",
  alternates: { canonical: "/app/units" },
};

export default function UnitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
