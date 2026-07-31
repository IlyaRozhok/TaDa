"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  selectOnboardingCompleted,
} from "@/store/slices/authSlice";

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const onboardingCompleted = useSelector(selectOnboardingCompleted);
  const router = useRouter();

  useEffect(() => {
    // Simple redirect logic
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (!user) {
      // Wait for user to load
      return;
    }

    // Check onboarding status - redirect to onboarding if not onboarded
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    if (!onboardingCompleted && !currentPath.includes("/onboarding")) {
      router.replace("/app/onboarding");
      return;
    }

    // Redirect based on role
    const role = user.role || "tenant";

    switch (role) {
      case "admin":
        router.replace("/app/admin/panel");
        break;
      case "tenant":
      default:
        router.replace("/app/units");
        break;
    }
  }, [isAuthenticated, user, onboardingCompleted, router]);

  // Empty page while redirecting
  return null;
}
