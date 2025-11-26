import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./components/providers/ReduxProvider";
import SessionManager from "./components/providers/SessionManager";
import EmailJSInitializer from "./components/EmailJSInitializer";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import SilenceConsole from "./components/SilenceConsole";


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
          href="/bg.png"
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
        <Suspense fallback={<div>Loading...</div>}>
          <I18nProvider>
            <ReduxProvider>
              <AuthProvider>
                <SessionManager />
                <SilenceConsole />
                <EmailJSInitializer />
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                      borderRadius: "12px",
                      padding: "16px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                      fontSize: "14px",
                      fontWeight: "500",
                      maxWidth: "400px",
                    },
                    success: {
                      duration: 4000,
                      style: {
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#fff",
                        border: "1px solid #059669",
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
                        fontSize: "14px",
                        fontWeight: "500",
                        maxWidth: "400px",
                      },
                    },
                    error: {
                      duration: 6000,
                      style: {
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "#fff",
                        border: "1px solid #dc2626",
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
                        fontSize: "14px",
                        fontWeight: "500",
                        maxWidth: "400px",
                      },
                    },
                  }}
                />
              </AuthProvider>
            </ReduxProvider>
          </I18nProvider>
        </Suspense>
      </body>
    </html>
  );
}
