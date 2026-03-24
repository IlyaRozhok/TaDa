"use client";

import React, { useEffect, useMemo, useState } from "react";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import { TenantCvView } from "../../components/tenant-cv/TenantCvView";
import { TenantCvResponse } from "../../types/tenantCv";
import Footer from "../../components/Footer";
import TenantCvSkeleton from "../../components/ui/TenantCvSkeleton";
import { notify } from "@/shared/lib/notify";
import { waitForSessionManager } from "../../components/providers/SessionManager";
import {
  useGetTenantCvQuery,
  useCreateTenantCvShareMutation,
  useGetPreferencesQuery,
} from "../../store/slices/apiSlice";

export default function TenantCvPage() {
  const [data, setData] = useState<TenantCvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        await waitForSessionManager();
      } catch {
        // ignore; page will still continue with normal error handling
      } finally {
        if (isMounted) {
          setSessionReady(true);
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load tenant CV via RTK Query with 5‑минутным кэшем
  const {
    data: cvQueryData,
    isLoading,
    error: cvQueryError,
  } = useGetTenantCvQuery(undefined, {
    skip: !sessionReady,
  });

  const [createShare] = useCreateTenantCvShareMutation();
  const { data: preferencesQueryData } = useGetPreferencesQuery(undefined, {
    skip: !sessionReady,
  });

  const preferencesFilledCount = useMemo(() => {
    const preferences =
      (preferencesQueryData &&
        typeof preferencesQueryData === "object" &&
        "data" in preferencesQueryData
        ? (preferencesQueryData as { data?: Record<string, unknown> }).data
        : preferencesQueryData) as Record<string, unknown> | undefined;

    if (!preferences || typeof preferences !== "object") {
      return 0;
    }

    let filledCount = 0;
    if (preferences.primary_postcode) filledCount += 1;
    if (preferences.min_price != null || preferences.max_price != null) filledCount += 1;
    if (preferences.min_bedrooms != null) filledCount += 1;
    if (preferences.furnishing) filledCount += 1;
    if (preferences.let_duration) filledCount += 1;
    if (preferences.designer_furniture !== undefined && preferences.designer_furniture !== null) filledCount += 1;
    if (preferences.house_shares) filledCount += 1;
    if (Array.isArray(preferences.convenience_features) && preferences.convenience_features.length > 0) filledCount += 1;
    if (preferences.ideal_living_environment) filledCount += 1;
    if (preferences.pets) filledCount += 1;
    if (preferences.smoker !== undefined && preferences.smoker !== null) filledCount += 1;
    if (preferences.move_in_date) filledCount += 1;
    if (preferences.max_bedrooms != null) filledCount += 1;
    if (preferences.min_bathrooms != null || preferences.max_bathrooms != null) filledCount += 1;
    if (Array.isArray(preferences.hobbies) && preferences.hobbies.length > 0) filledCount += 1;
    if (preferences.additional_info) filledCount += 1;
    if (preferences.date_property_added) filledCount += 1;

    return filledCount;
  }, [preferencesQueryData]);

  function extractShareUuid(body: unknown): string | undefined {
    if (!body || typeof body !== "object") return undefined;
    const o = body as Record<string, unknown>;
    if (typeof o.share_uuid === "string") return o.share_uuid;
    const inner = o.data;
    if (inner && typeof inner === "object" && typeof (inner as { share_uuid?: string }).share_uuid === "string") {
      return (inner as { share_uuid: string }).share_uuid;
    }
    return undefined;
  }

  // Normalize and store data in local state (so existing view API не меняется)
  useEffect(() => {
    if (!cvQueryData) return;
    const cvData =
      ((cvQueryData as any).data as TenantCvResponse) ||
      (cvQueryData as TenantCvResponse);
    setData(cvData);
    setError(null);

    if (cvData.share_uuid && typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/cv/${cvData.share_uuid}`);
    }
  }, [cvQueryData]);

  // Handle errors from RTK Query
  useEffect(() => {
    if (!cvQueryError) return;
    const err = cvQueryError as any;
    const message =
      err?.data?.message ||
      err?.error ||
      (typeof err?.message === "string" ? err.message : undefined);
    setError(message || "Failed to load CV");
  }, [cvQueryError]);

  const handleShare = async () => {
    let copied = false;
    try {
      setShareLoading(true);
      const result = await createShare().unwrap();
      const uuid = extractShareUuid(result);
      if (!uuid || typeof window === "undefined") {
        notify.error("Unable to generate share link");
        return;
      }
      const url = `${window.location.origin}/cv/${uuid}`;
      setShareUrl(url);
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          copied = true;
        }
      } catch {
        // Safari often rejects Clipboard API even after a click; fall back below
      }
      if (!copied) {
        try {
          const ta = document.createElement("textarea");
          ta.value = url;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          copied = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch {
          copied = false;
        }
      }
      if (copied) {
        notify.success("Link copied to clipboard!");
      } else {
        notify.error(`Could not copy automatically. Use this link: ${url}`);
      }
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "data" in e &&
        (e as { data?: { message?: string } }).data?.message;
      notify.error(typeof msg === "string" ? msg : "Unable to generate share link");
    } finally {
      setShareLoading(false);
    }
  };

  const isInitialLoading = !sessionReady || (isLoading && !data);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TenantUniversalHeader
        showPreferencesButton={true}
        showTenantCvLink={false}
        showFavouritesButton={false}
        preferencesCount={preferencesFilledCount}
      />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 pb-10 mt-6">
          {isInitialLoading ? (
            <div className="min-h-[55vh] transition-opacity duration-200">
              <TenantCvSkeleton />
            </div>
          ) : null}
          {!isInitialLoading && error ? (
            <div className="min-h-[55vh] flex items-center justify-center text-center text-red-600">
              {error}
            </div>
          ) : null}
          {!isInitialLoading && !error && data ? (
            <div className="transition-opacity duration-300 opacity-100">
              <TenantCvView
                data={data}
                shareUrl={shareUrl}
                onShareClick={handleShare}
                shareLoading={shareLoading}
              />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
