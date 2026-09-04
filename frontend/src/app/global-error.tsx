"use client";

/**
 * Last-resort boundary: catches errors thrown by the root layout itself,
 * where error.tsx cannot help. It replaces the whole document, so it must
 * render its own <html>/<body> and depend on nothing from the app (no
 * providers, no Tailwind classes — inline styles only).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#ffffff",
          color: "#111827",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#4b5563", marginBottom: 24 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#000000",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
