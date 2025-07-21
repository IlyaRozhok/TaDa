"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import {
  redirectAfterLogin,
  getUserRole,
  getPrimaryRole,
} from "../../utils/simpleRedirect";

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    console.log("🔍 Dashboard page - auth state:", {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      primaryRole: user ? getPrimaryRole(user) : "unknown",
      userProvider: user?.provider,
    });

    if (!isAuthenticated) {
      console.log("🔄 Not authenticated, redirecting to home");
      router.replace("/");
      return;
    }

    if (!user) {
      console.log("⏳ User not loaded yet, waiting...");
      return; // Still loading
    }

    console.log("🔄 User loaded, attempting redirect...");
    // Simple redirect to user's dashboard
    redirectAfterLogin(user, router);
  }, [isAuthenticated, user, router]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.error("⚠️ Dashboard timeout reached - forcing fallback");
      setTimeoutReached(true);

      if (isAuthenticated && user) {
        const primaryRole = getPrimaryRole(user);
        console.log(
          `🔄 Timeout fallback: redirecting based on primary role "${primaryRole}"`
        );

        if (primaryRole === "admin") {
          router.replace("/app/dashboard/admin");
        } else if (primaryRole === "operator") {
          router.replace("/app/dashboard/operator");
        } else if (primaryRole === "tenant") {
          router.replace("/app/dashboard/tenant");
        } else {
          // No role or unknown role - go to role selection
          console.log(
            "🔄 No valid role detected, redirecting to role selection"
          );
          router.replace("/?needsRole=true");
        }
      } else {
        router.replace("/");
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isAuthenticated, user, router]);

  // Show loading while determining dashboard
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>

        {timeoutReached ? (
          <>
            <p className="text-red-600 font-medium mb-2">
              Loading timeout reached
            </p>
            <p className="text-slate-600 text-sm">
              Trying alternative redirect...
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-600 mb-2">Loading your dashboard...</p>
            {user && (
              <div className="text-xs text-slate-400 space-y-1">
                <p>Redirecting to {getPrimaryRole(user)} dashboard...</p>
                <p>User: {user.email}</p>
                <p>Role: {user.role || "Not set"}</p>
                <p>Primary Role: {getPrimaryRole(user)}</p>
              </div>
            )}
            {!user && isAuthenticated && (
              <p className="text-xs text-slate-400">
                Fetching user information...
              </p>
            )}
          </>
        )}

        {/* Debug info for development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>isAuthenticated: {String(isAuthenticated)}</p>
            <p>hasUser: {String(!!user)}</p>
            <p>userRole: {user?.role || "none"}</p>
            <p>primaryRole: {user ? getPrimaryRole(user) : "none"}</p>
            <p>userEmail: {user?.email || "none"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
