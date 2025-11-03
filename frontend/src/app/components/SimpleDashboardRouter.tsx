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
    console.log("🔍 SimpleDashboardRouter check:", {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      requiredRole,
      userEmail: user?.email,
    });

    if (!isAuthenticated) {
      console.log("❌ Not authenticated, redirecting to /");
      router.replace("/");
      return;
    }

    if (!user) {
      console.log("⏳ User still loading");
      return; // Still loading
    }

    // Check role if required
    if (requiredRole) {
      const userRole = user.role || "tenant";
      const hasAccess = userRole === requiredRole || userRole === "admin";

      console.log("🔍 Role check:", {
        userRole,
        requiredRole,
        hasAccess,
        isAdmin: userRole === "admin",
      });

      if (!hasAccess) {
        console.log(
          `❌ Access denied, redirecting to /app/dashboard/${userRole}`
        );
        router.replace(`/app/dashboard/${userRole}`);
      } else {
        console.log("✅ Access granted");
      }
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // No loading UI
  if (!isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}
