"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";

interface DashboardRouterProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "operator" | "tenant";
}

export default function DashboardRouter({
  children,
  requiredRole,
}: DashboardRouterProps) {
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
        // Redirect to user's dashboard
        router.replace(`/app/dashboard/${userRole}`);
      }
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // No loading UI - render children immediately
  if (!isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}
