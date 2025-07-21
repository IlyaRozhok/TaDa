"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import { redirectAfterLogin } from "../../utils/simpleRedirect";

export default function DashboardPage() {
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

    // Simple redirect to user's dashboard
    redirectAfterLogin(user, router);
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
