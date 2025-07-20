"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import {
  getUserRole,
  getDashboardPath,
} from "../../components/DashboardRouter";

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("🔄 Dashboard: Not authenticated, redirecting to login");
      router.replace("/app/auth");
      return;
    }

    if (!user) {
      console.log("🔄 Dashboard: No user data, waiting...");
      return;
    }

    // Determine user role and redirect to appropriate dashboard
    const userRole = getUserRole(user);
    const dashboardPath = getDashboardPath(userRole);

    console.log("🔄 Dashboard: Redirecting to role-specific dashboard", {
      userRole,
      dashboardPath,
      user: { id: user.id, role: user.role, roles: user.roles },
    });

    // Immediate redirect without delay
    router.replace(dashboardPath);
  }, [isAuthenticated, user, router]);

  // Show loading while determining dashboard
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Loading your dashboard...</p>
        {user && (
          <p className="text-xs text-slate-400 mt-2">
            Redirecting to {getUserRole(user)} dashboard...
          </p>
        )}
      </div>
    </div>
  );
}
