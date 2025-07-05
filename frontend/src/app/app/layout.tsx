import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "TaDa - Rental Platform",
  description: "Connect tenants and property operators in London",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
