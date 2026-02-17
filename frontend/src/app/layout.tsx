import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./components/providers/ReduxProvider";
import SessionManager from "./components/providers/SessionManager";
import EmailJSInitializer from "./components/EmailJSInitializer";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import AppToaster from "./components/AppToaster";
import { Suspense } from "react";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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

        {/* Preload critical hero background images */}
        <link
          rel="preload"
          as="image"
          href="/tenant-hero-bg.png"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/tenant-landing-bg.png"
          fetchPriority="high"
        />

        {/* EmailJS Script */}
        <script
          type="text/javascript"
          src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
          async
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Suspense fallback={<div></div>}>
          <I18nProvider>
            <ReduxProvider>
              <AuthProvider>
                <SessionManager />
                <EmailJSInitializer />
                {children}
                <AppToaster />
              </AuthProvider>
            </ReduxProvider>
          </I18nProvider>
        </Suspense>
      </body>
    </html>
  );
}
