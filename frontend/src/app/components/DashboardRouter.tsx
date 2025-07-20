"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import { debugUserRole, debugRedirectLoop } from "../utils/debug";

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
      // Redirect to appropriate dashboard based on user's actual role
      const dashboardPath = getDashboardPath(userRole);
      debugRedirectLoop("DashboardRouter", user, dashboardPath);
      router.replace(dashboardPath);
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

// Helper function to get user's primary role
export function getUserRole(user: any): "admin" | "operator" | "tenant" {
  debugUserRole(user, "getUserRole");

  if (!user) {
    console.warn("⚠️ getUserRole: No user provided, defaulting to tenant");
    return "tenant";
  }

  // First check the direct role field (new structure)
  if (user.role) {
    const role = user.role.toLowerCase().trim();
    console.log("🔍 getUserRole: Found role field:", role);

    if (role === "admin") return "admin";
    if (role === "operator") return "operator";
    if (role === "tenant") return "tenant";
  }

  // Fallback to roles array (backward compatibility)
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0].toLowerCase().trim();
    console.log("🔍 getUserRole: Found roles array, first role:", firstRole);

    if (firstRole === "admin") return "admin";
    if (firstRole === "operator") return "operator";
    if (firstRole === "tenant") return "tenant";
  }

  // Fallback based on profiles (if role fields are missing)
  if (user.operatorProfile) {
    console.log("🔍 getUserRole: Found operatorProfile, assuming operator");
    return "operator";
  }
  if (user.tenantProfile) {
    console.log("🔍 getUserRole: Found tenantProfile, assuming tenant");
    return "tenant";
  }

  // Default fallback
  console.warn(
    "⚠️ getUserRole: Could not determine user role, defaulting to tenant",
    user
  );
  return "tenant";
}

// Helper function to get dashboard path for role
export function getDashboardPath(
  role: "admin" | "operator" | "tenant"
): string {
  switch (role) {
    case "admin":
      return "/app/dashboard/admin";
    case "operator":
      return "/app/dashboard/operator";
    case "tenant":
    default:
      return "/app/dashboard/tenant";
  }
}
