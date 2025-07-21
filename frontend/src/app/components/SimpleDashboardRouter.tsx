"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import { redirectAfterLogin } from "../utils/simpleRedirect";

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

    // If no role required, allow access
    if (!requiredRole) {
      return;
    }

    // Check if user has required role (admin can access everything)
    const hasAccess = user.role === requiredRole || user.role === "admin";

    if (!hasAccess) {
      console.log(`🔄 Access denied: ${user.email} needs ${requiredRole} role`);
      redirectAfterLogin(user, router); // Redirect to user's proper dashboard
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // Show loading while checking
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-slate-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
