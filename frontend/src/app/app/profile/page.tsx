"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import ProfilePageSkeleton from "./ProfilePageSkeleton";
import { useGetPreferencesQuery } from "../../store/slices/apiSlice";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canFetchPreferences, setCanFetchPreferences] = useState(false);
  const { data: preferencesQueryData } = useGetPreferencesQuery(undefined, {
    skip: !canFetchPreferences,
  });

  const preferencesFilledCount = useMemo(() => {
    const preferences = (
      preferencesQueryData &&
      typeof preferencesQueryData === "object" &&
      "data" in preferencesQueryData
        ? (preferencesQueryData as { data?: Record<string, unknown> }).data
        : preferencesQueryData
    ) as Record<string, unknown> | undefined;

    if (!preferences || typeof preferences !== "object") {
      return 0;
    }

    let filledCount = 0;
    if (preferences.primary_postcode) filledCount += 1;
    if (preferences.min_price != null || preferences.max_price != null)
      filledCount += 1;
    if (preferences.min_bedrooms != null) filledCount += 1;
    if (preferences.furnishing) filledCount += 1;
    if (preferences.let_duration) filledCount += 1;
    if (
      preferences.designer_furniture !== undefined &&
      preferences.designer_furniture !== null
    )
      filledCount += 1;
    if (preferences.house_shares) filledCount += 1;
    if (
      Array.isArray(preferences.convenience_features) &&
      preferences.convenience_features.length > 0
    )
      filledCount += 1;
    if (preferences.ideal_living_environment) filledCount += 1;
    if (preferences.pets) filledCount += 1;
    if (preferences.smoker !== undefined && preferences.smoker !== null)
      filledCount += 1;
    if (preferences.move_in_date) filledCount += 1;
    if (preferences.max_bedrooms != null) filledCount += 1;
    if (preferences.min_bathrooms != null || preferences.max_bathrooms != null)
      filledCount += 1;
    if (Array.isArray(preferences.hobbies) && preferences.hobbies.length > 0)
      filledCount += 1;
    if (preferences.additional_info) filledCount += 1;
    if (preferences.date_property_added) filledCount += 1;

    return filledCount;
  }, [preferencesQueryData]);

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
          if (isMounted) setCanFetchPreferences(false);
          router.replace("/app/auth/login");
          return;
        }

        if (isMounted) {
          setCanFetchPreferences(true);
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
          setCanFetchPreferences(false);
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
        <ProfilePageSkeleton />
      </div>
    );
  }

  // Show error state
  if (hasError && !user?.id) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          showPreferencesButton={true}
          preferencesCount={preferencesFilledCount}
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
        preferencesCount={preferencesFilledCount}
      />

      <div className="max-w-4xl mx-auto px-5 pb-32 pt-10">
        <UnifiedProfileForm user={user} />
      </div>
      <Footer />
    </div>
  );
}