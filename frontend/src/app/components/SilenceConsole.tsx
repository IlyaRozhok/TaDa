"use client";

import { useEffect } from "react";

export default function SilenceConsole() {
  useEffect(() => {
    const original = { ...console } as Console;
    // Replace noisy methods with no-ops
    console.log = () => {};
    console.warn = () => {};
    console.error = (...args: unknown[]) => {
      // Keep errors visible in dev tools without serializing complex objects
      if (process.env.NODE_ENV === "development") {
        original.error?.call(original, typeof args?.[0] === "string" ? args[0] : "Error");
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
