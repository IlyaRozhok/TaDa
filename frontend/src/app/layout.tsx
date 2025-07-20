import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./components/providers/ReduxProvider";
import SessionManager from "./components/providers/SessionManager";
import { LanguageProvider } from "./lib/language-context";
import CookieNotification from "./components/CookieModal";
import { Toaster } from "react-hot-toast";

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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <ReduxProvider>
            <SessionManager />
            {children}
            <CookieNotification />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  style: {
                    background: "#10b981",
                    color: "#fff",
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: "#ef4444",
                    color: "#fff",
                  },
                },
              }}
            />
          </ReduxProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
