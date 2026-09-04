import Link from "next/link";

/** Styled 404 — the default one was the unbranded Next.js page. */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md mx-auto">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Page not found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
