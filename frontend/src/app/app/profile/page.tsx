"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  setAuth,
} from "../../store/slices/authSlice";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import { ProfileForm } from "../../../features/profile/update-profile/ui/ProfileForm";
import { authAPI } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check auth and load profile once
  useEffect(() => {
    const initializeProfile = async () => {
      const token = typeof window !== "undefined" 
        ? localStorage.getItem("accessToken") 
        : null;

      if (!token) {
        router.replace("/app/auth/login");
        return;
      }

      // If we already have user data, no need to fetch again
      if (user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authAPI.getProfile();
        const fetchedUser = res.data;
        dispatch(setAuth({ user: fetchedUser, accessToken: token }));
        setHasError(false);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setHasError(true);
        if (err.response?.status === 401) {
          router.replace("/app/auth/login");
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, [router, dispatch, user?.id]);

  // Show loading state
  if (typeof window === "undefined" || isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          showPreferencesButton={false}
        />
        <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
          <div className="py-16 text-center text-gray-600">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError && !user?.id) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          showPreferencesButton={false}
        />
        <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
          <div className="py-16 text-center text-red-600">
            Failed to load profile. Please refresh the page.
          </div>
        </div>
      </div>
    );
  }

  // Normal render with profile form
  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        showPreferencesButton={false}
      />

      <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}