"use client";

import { useEffect, useState } from "react";

// Type declarations for EmailJS (kept for RequestDemoModal / other usage)
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeEmailJS = async () => {
      try {
        // Fetch EmailJS configuration from API
        const response = await fetch("/api/emailjs-config");
        
        if (!response.ok) {
          console.error("❌ Failed to fetch EmailJS config:", response.statusText);
          return;
        }

        const data = await response.json();
        
        if (!data.success || !data.config) {
          console.error("❌ Invalid EmailJS config response:", data);
          return;
        }

        const { serviceId, templateId, publicKey } = data.config;

        // Wait for EmailJS script to load
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        while (!window.emailjs && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.emailjs) {
          console.error("❌ EmailJS script failed to load");
          return;
        }

        // Set global config
        window.EMAILJS_CONFIG = {
          serviceId,
          templateId,
          publicKey,
        };

        // Initialize EmailJS with public key
        window.emailjs.init(publicKey);

        console.log("✅ EmailJS initialized successfully");
        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Error initializing EmailJS:", error);
      }
    };

    // Only run in browser environment
    if (typeof window !== "undefined") {
      initializeEmailJS();
    }
  }, []);

  // Component doesn't render anything visible
  return null;
}
