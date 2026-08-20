import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./components/providers/ReduxProvider";
import SessionManager from "./components/providers/SessionManager";
import AnalyticsProvider from "./components/providers/AnalyticsProvider";
import PageViewTracker from "./components/providers/PageViewTracker";
import EmailJSInitializer from "./components/EmailJSInitializer";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { I18nProvider } from "./contexts/I18nContext";
import AppToaster from "./components/AppToaster";
import { Suspense } from "react";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Only the production deployment (ta-da.co) may be indexed. Staging and
// preview deployments stay hidden from crawlers. NEXT_PUBLIC_VERCEL_ENV is
// set automatically by Vercel and is "production" only for the prod deploy;
// robots.ts applies the same rule at the robots.txt level.
const isIndexable = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL("https://ta-da.co"),
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
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Expires" content="0" />

        {/* No hand-written image preloads here. They sat in the root layout, so
            every route paid for them, and neither one helped: the hero is
            rendered by <Image priority>, which emits its own preload for the
            optimised URL, so preloading the raw PNG only fetched a second copy
            the page never used. */}

        {/* EmailJS Script */}
        <script
          type="text/javascript"
          src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
          async
        ></script>
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
                {/* Its own boundary: the tracker reads useSearchParams(),
                    and without one the whole app tree it sits in loses static
                    rendering — the landing page's prerendered HTML collapses
                    to the fallback and is client-rendered instead. */}
                <Suspense fallback={null}>
                  <PageViewTracker />
                </Suspense>
                <EmailJSInitializer />
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
