"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  selectIsOnboarded,
} from "../../store/slices/authSlice";

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isOnboarded = useSelector(selectIsOnboarded);
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
    if (!isOnboarded && !currentPath.includes("/onboarding")) {
      router.replace("/app/onboarding");
      return;
    }

    // Redirect based on role
    const role = user.role || "tenant";

    switch (role) {
      case "admin":
        router.replace("/app/admin/panel");
        break;
      case "operator":
        router.replace("/app/dashboard/operator");
        break;
      case "tenant":
      default:
        router.replace("/app/units");
        break;
    }
  }, [isAuthenticated, user, isOnboarded, router]);

  // Empty page while redirecting
  return null;
}
