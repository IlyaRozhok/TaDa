import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/app/lib/siteMetadata";
import "../globals.css";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
