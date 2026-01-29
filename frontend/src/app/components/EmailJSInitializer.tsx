"use client";

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
  // EmailJS config is no longer fetched from /api/emailjs-config
  return null;
}
