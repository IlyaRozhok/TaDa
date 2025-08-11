"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";

interface SimpleDashboardRouterProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "operator" | "tenant";
}

export default function SimpleDashboardRouter({
  children,
  requiredRole,
}: SimpleDashboardRouterProps) {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (!user) {
      return; // Still loading
    }

    // Check role if required
    if (requiredRole) {
      const userRole = user.role || "tenant";
      const hasAccess = userRole === requiredRole || userRole === "admin";

      if (!hasAccess) {
        router.replace(`/app/dashboard/${userRole}`);
      }
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // No loading UI
  if (!isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}
