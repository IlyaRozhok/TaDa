"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import Footer from "../../components/Footer";
import { UnifiedProfileForm } from "../../../features/profile/update-profile/ui/UnifiedProfileForm";
import ProfilePageSkeleton from "./ProfilePageSkeleton";
import { useGetPreferencesQuery } from "@/store/slices/apiSlice";
import { waitForSessionManager } from "../../components/providers/SessionManager";
import { store } from "@/store/store";
import { hasPreferencesLocationFilled } from "../../../entities/preferences/model/preferences";

export default function ProfilePage() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { data: preferencesQueryData } = useGetPreferencesQuery(undefined, {
    skip: !sessionReady,
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
    if (hasPreferencesLocationFilled(preferences)) filledCount += 1;
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

    return filledCount;
  }, [preferencesQueryData]);

  // Don't memoize user - let useUnifiedProfile handle stability

  // Check auth and load profile once
  useEffect(() => {
    let isMounted = true;
    
    const initializeProfile = async () => {
      try {
        await waitForSessionManager();

        if (!isMounted) return;
        setSessionReady(true);

        // Fresh auth from store (avoid stale closure on `user` from first render).
        // SessionManager restores the session via cookie — no localStorage token needed.
        const { user: storeUser, isAuthenticated } = store.getState().auth;
        if (!storeUser?.id || !isAuthenticated) {
          router.replace("/app/auth");
          return;
        }

        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

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