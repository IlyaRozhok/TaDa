"use client";

import AuthPage from "../page";

// Simply render the auth page component directly
// No redirect needed - this prevents redirect chains
export default function LoginPage() {
  return <AuthPage />;
}
