"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import { debugUserRole, debugRedirectLoop } from "../utils/debug";
import { getUserRole, redirectAfterLogin } from "../utils/simpleRedirect";

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
      // Still loading user data
      return;
    }

    // Determine user's actual role using the improved function
    const userRole = getUserRole(user);

    console.log("🔄 DashboardRouter: Role check", {
      user_id: user.id,
      userRole,
      requiredRole,
      hasRequiredRole: userRole === requiredRole,
    });

    // If no specific role required, allow access
    if (!requiredRole) {
      return;
    }

    // Check if user has the required role
    // Allow admin users to access any dashboard
    const hasRequiredRole = userRole === requiredRole || userRole === "admin";

    if (!hasRequiredRole) {
      // Redirect to user's proper dashboard
      debugRedirectLoop(
        "DashboardRouter",
        user,
        "redirect to proper dashboard"
      );
      redirectAfterLogin(user, router);
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // Show loading while checking authentication
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (requiredRole) {
    const userRole = getUserRole(user);
    // Allow admin users to access any dashboard
    const hasRequiredRole = userRole === requiredRole || userRole === "admin";

    if (!hasRequiredRole) {
      // Show loading while redirecting
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
