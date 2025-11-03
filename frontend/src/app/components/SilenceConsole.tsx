"use client";

import { useEffect } from "react";

/**
 * Disables console logging in the browser to avoid circular JSON errors
 * from logging complex React/DOM objects. No-ops in production by default too.
 */
export default function SilenceConsole() {
  useEffect(() => {
    const original = { ...console } as Console;
    // Replace noisy methods with no-ops
    console.log = () => {};
    console.warn = () => {};
    console.error = (...args: unknown[]) => {
      // Keep errors visible in dev tools without serializing complex objects
      if (process.env.NODE_ENV === "development") {
        original.error?.(typeof args?.[0] === "string" ? args[0] : "Error");
      }
    };
    console.info = () => {};
    console.debug = () => {};

    return () => {
      // Restore on unmount just in case
      Object.assign(console, original);
    };
  }, []);

  return null;
}
