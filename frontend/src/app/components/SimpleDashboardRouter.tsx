"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  selectUser,
  selectIsAuthenticated,
  selectOnboardingCompleted,
} from "@/store/slices/authSlice";
import { waitForSessionManager } from "./providers/SessionManager";
import {
  PHONE_VERIFICATION_PATH,
  isPhoneVerificationPending,
} from "@/shared/lib/phoneVerification";

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
  const onboardingCompleted = useSelector(selectOnboardingCompleted);
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
      onboardingCompleted,
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

    // Check onboarding status - redirect to onboarding if not onboarded
    // Skip this check if already on onboarding page to avoid redirect loop.
    // A new user verifies their phone there too, inline in the form.
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    if (!onboardingCompleted && !currentPath.includes("/onboarding")) {
      console.log("❌ User not onboarded, redirecting to /app/onboarding");
      router.replace("/app/onboarding");
      return;
    }

    // An onboarded user the gate still needs verifies on the standalone
    // screen (only while the backend reports the gate on for this user).
    if (isPhoneVerificationPending(user)) {
      router.replace(PHONE_VERIFICATION_PATH);
      return;
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
        // The dashboard routes are gone; the units listing is the safe
        // landing every role can open.
        console.log("❌ Access denied, redirecting to /app/units");
        router.replace("/app/units");
        return;
      } else {
        console.log("✅ Access granted");
      }
    }
  }, [sessionInitialized, isAuthenticated, user, onboardingCompleted, requiredRole, router]);



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
