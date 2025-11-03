"use client";

import { useEffect } from "react";

// Type declarations for EmailJS
declare global {
  interface Window {
    emailjs?: {
      init: (publicKey: string) => void;
      send: (
        serviceId: string,
        templateId: string,
        templateParams: Record<string, unknown>,
        publicKey?: string
      ) => Promise<{ status: number; text: string }>;
    };
    EMAILJS_CONFIG?: {
      serviceId: string;
      templateId: string;
      publicKey: string;
    };
  }
}

export default function EmailJSInitializer() {
  useEffect(() => {
    let initAttempts = 0;
    const maxInitAttempts = 50;

    async function initEmailJS() {
      initAttempts++;

      if (typeof window !== "undefined" && window.emailjs) {
        console.log("EmailJS script loaded, getting config from API...");

        try {
          const response = await fetch("/api/emailjs-config");
          const data = await response.json();

          console.log("API Response:", data);

          if (data.success && data.config) {
            const { serviceId, templateId, publicKey } = data.config;

            // Store config globally
            window.EMAILJS_CONFIG = data.config;

            // Initialize EmailJS
            window.emailjs.init(publicKey);

            console.log("✅ EmailJS initialized successfully!", {
              serviceId: `${serviceId.substring(0, 8)}...`,
              templateId: `${templateId.substring(0, 8)}...`,
              publicKey: `${publicKey.substring(0, 8)}...`,
            });
          } else {
            console.error("❌ API returned invalid response:", data);
          }
        } catch (error) {
          console.error("❌ Failed to get EmailJS config:", error);
        }
      } else if (initAttempts < maxInitAttempts) {
        console.log(
          `⏳ EmailJS not ready, retrying... (${initAttempts}/${maxInitAttempts})`
        );
        setTimeout(initEmailJS, 100);
      } else {
        console.error(
          "❌ EmailJS failed to load after",
          maxInitAttempts,
          "attempts"
        );
      }
    }

    initEmailJS();
  }, []);

  return null; // This component doesn't render anything
}
