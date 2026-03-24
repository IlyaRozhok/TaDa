"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  setAuth,
} from "../../store/slices/authSlice";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import Footer from "../../components/Footer";
import { UnifiedProfileForm } from "../../../features/profile/update-profile/ui/UnifiedProfileForm";
import { authAPI } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Don't memoize user - let useUnifiedProfile handle stability

  // Check auth and load profile once
  useEffect(() => {
    let isMounted = true;
    
    const initializeProfile = async () => {
      try {
        const token = typeof window !== "undefined" 
          ? localStorage.getItem("accessToken") 
          : null;

        if (!token) {
          router.replace("/app/auth/login");
          return;
        }

        // Capture current user state to avoid race conditions
        const currentUser = user;
        
        // If we already have user data, no need to fetch again
        if (currentUser?.id) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Add a small delay to let SessionManager finish if it's running
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!isMounted) return;

        // Check again if user was loaded by SessionManager
        const updatedUser = user;
        if (updatedUser?.id) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const res = await authAPI.getProfile();
        const fetchedUser = res.data?.user || res.data;
        
        if (!fetchedUser || !fetchedUser.id) {
          throw new Error("Invalid user data received from API");
        }
        
        if (isMounted) {
          dispatch(setAuth({ user: fetchedUser, accessToken: token }));
          setHasError(false);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (isMounted) {
          setHasError(true);
          if (err.response?.status === 401) {
            router.replace("/app/auth/login");
            return;
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeProfile();
    
    return () => {
      isMounted = false;
    };
  }, [router, dispatch]);

  // Show loading state
  if (typeof window === "undefined" || isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          showPreferencesButton={true}
        />
        <div className="max-w-4xl mx-auto px-5 pb-32 pt-10">
          <div className="py-16 text-center text-gray-600">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
            Loading profile...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (hasError && !user?.id) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          showPreferencesButton={true}
        />
        <div className="max-w-4xl mx-auto px-5 pb-32 pt-10">
          <div className="py-16 text-center text-red-600">
            Failed to load profile. Please refresh the page.
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Normal render with profile form
  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        showPreferencesButton={true}
      />

      <div className="max-w-4xl mx-auto px-5 pb-32 pt-10">
        <UnifiedProfileForm user={user} />
      </div>
      <Footer />
    </div>
  );
}