"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-segment error boundary. Before it existed, ANY uncaught render or
 * effect error anywhere in the app showed Next's unstyled "Application
 * error: a client-side exception has occurred" white screen with no way
 * back. Copy stays plain English on purpose: the i18n context itself can be
 * what just crashed.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. You can try again, or go back to the
          home page.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="block w-full text-gray-500 px-6 py-2 text-sm hover:text-gray-900 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
