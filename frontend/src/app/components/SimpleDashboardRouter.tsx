"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import { waitForSessionManager } from "./providers/SessionManager";

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
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // Wait for session manager to initialize
  useEffect(() => {
    const initSession = async () => {
      try {
        await waitForSessionManager();
        setSessionInitialized(true);
      } catch (error) {
        console.error("Failed to wait for session manager:", error);
        setSessionInitialized(true); // Still mark as initialized to prevent blocking
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    // Don't do anything until session is initialized
    if (!sessionInitialized) {
      console.log("⏳ Waiting for session initialization...");
      return;
    }

    console.log("🔍 SimpleDashboardRouter check:", {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      requiredRole,
      userEmail: user?.email,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : "",
      sessionInitialized,
    });

    // Check authentication after session is initialized
    if (!isAuthenticated) {
      console.log("❌ Not authenticated, redirecting to /");
      router.replace("/");
      return;
    }

    // Wait for user to load if authenticated
    if (!user) {
      console.log("⏳ User still loading, waiting...");
      return; // Still loading - don't redirect yet
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
        return;
      } else {
        console.log("✅ Access granted");
      }
    }
  }, [sessionInitialized, isAuthenticated, user, requiredRole, router]);



  // If not authenticated after session initialization, show nothing (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated but user not loaded yet, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  // If role is required, check it before rendering
  if (requiredRole) {
    const userRole = user.role || "tenant";
    const hasAccess = userRole === requiredRole || userRole === "admin";

    if (!hasAccess) {
      // Redirect is happening in useEffect, show nothing
      return null;
    }
  }

  return <>{children}</>;
}
