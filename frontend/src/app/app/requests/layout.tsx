import type { Metadata } from "next";

// Private-by-nature route: never indexable, whatever robots.txt says —
// crawlers that reach it by a shared link get an explicit noindex.
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function NoIndexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
