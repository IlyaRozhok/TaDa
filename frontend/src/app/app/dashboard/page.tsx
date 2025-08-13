"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
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
        router.replace("/app/dashboard/tenant");
        break;
    }
  }, [isAuthenticated, user, router]);

  // Empty page while redirecting
  return null;
}
