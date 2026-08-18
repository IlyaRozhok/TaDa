import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./components/providers/ReduxProvider";
import SessionManager from "./components/providers/SessionManager";
import AnalyticsProvider from "./components/providers/AnalyticsProvider";
import EmailJSInitializer from "./components/EmailJSInitializer";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { I18nProvider } from "./contexts/I18nContext";
import AppToaster from "./components/AppToaster";
import { Suspense } from "react";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaDa - Rental Platform",
  description: "Connect tenants and property operators in London",
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
        <meta
          name="robots"
          content="noindex,nofollow,noarchive,nosnippet,noimageindex"
        />
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
