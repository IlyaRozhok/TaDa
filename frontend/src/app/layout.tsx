import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./components/providers/ReduxProvider";
import SessionManager from "./components/providers/SessionManager";
import AnalyticsProvider from "./components/providers/AnalyticsProvider";
import PostHogProvider from "./components/providers/PostHogProvider";
import PageViewTracker from "./components/providers/PageViewTracker";
import NavigationDepthProvider from "./components/providers/NavigationDepthProvider";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { I18nProvider } from "./contexts/I18nContext";
import AppToaster from "./components/AppToaster";
import { Suspense } from "react";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Only the production deployment (www.ta-da.co) may be indexed. Staging and
// preview deployments stay hidden from crawlers; robots.ts applies the same
// rule at the robots.txt level. The switch lives in lib/siteEnv.ts.
import { isIndexableSite as isIndexable } from "@/app/lib/siteEnv";
import { SITE_URL } from "@/app/lib/siteUrl";

export const metadata: Metadata = {
  // Every relative `alternates.canonical` and OpenGraph image below resolves
  // against this, so it must be the www host the site actually serves from.
  metadataBase: new URL(SITE_URL),
  title: "TaDa - Rental Platform",
  description: "Connect tenants and property operators in London",
  robots: isIndexable
    ? { index: true, follow: true }
    : {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
      },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* No hand-written image preloads here. They sat in the root layout, so
            every route paid for them, and neither one helped: the hero is
            rendered by <Image priority>, which emits its own preload for the
            optimised URL, so preloading the raw PNG only fetched a second copy
            the page never used. */}

      </head>
      <body
        className={`${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Suspense fallback={<div></div>}>
          <I18nProvider>
            <ReduxProvider>
                <SessionManager />
                <AnalyticsProvider />
                {/* Alongside AnalyticsProvider, not inside it: replay answers
                    to a stricter chain than GA4 (accepted consent, tenants
                    only). See src/lib/analytics/posthog.ts. */}
                <PostHogProvider />
                {/* Its own boundary: the tracker reads useSearchParams(),
                    and without one the whole app tree it sits in loses static
                    rendering — the landing page's prerendered HTML collapses
                    to the fallback and is client-rendered instead. */}
                <Suspense fallback={null}>
                  <PageViewTracker />
                </Suspense>
                {/* Its own boundary too, and for the same reason — it reads
                    useSearchParams() as well. Sharing one boundary with the
                    tracker would work, but separate ones keep the reason
                    attached to the component that owns it. */}
                <Suspense fallback={null}>
                  <NavigationDepthProvider />
                </Suspense>
                {children}
                <CookieConsentBanner />
                <AppToaster />
            </ReduxProvider>
          </I18nProvider>
        </Suspense>
      </body>
    </html>
  );
}
