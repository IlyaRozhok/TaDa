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
import { hasPreferencesLocationFilled } from "../../../entities/preferences/model/preferences";

export default function TenantCvPage() {
  const [data, setData] = useState<TenantCvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [manualCopyLoading, setManualCopyLoading] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const isSafariLike = () => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    // Safari is detected as "Safari" + not common Chromium-based browsers.
    return (
      /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Android/i.test(ua)
    );
  };

  const execCommandCopy = (text: string): boolean => {
    try {
      // IMPORTANT (Safari): this must be executed synchronously inside a click
      // handler. Avoid any `await` on the call path when possible.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.readOnly = true;

      // Keep it in the layout/rendering pipeline (opacity 0 often breaks copy
      // in Safari). 1x1px + offscreen is usually safe.
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "1px";
      ta.style.height = "1px";
      ta.style.padding = "0";
      ta.style.margin = "0";
      ta.style.border = "0";
      ta.style.opacity = "1";
      ta.style.background = "transparent";
      ta.style.zIndex = "9999";

      document.body.appendChild(ta);
      ta.focus();
      ta.select();

      // Safari sometimes needs explicit selection range.
      try {
        ta.setSelectionRange(0, text.length);
      } catch {
        // ignore
      }

      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const copyTextToClipboardAsync = async (text: string): Promise<boolean> => {
    // 1) Modern async clipboard API (works in most browsers)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Safari can reject the Clipboard API even after a click; fall back below.
    }

    // 2) Legacy fallback via execCommand
    return execCommandCopy(text);
  };

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

  function extractShareUuid(body: unknown): string | undefined {
    if (!body || typeof body !== "object") return undefined;
    const o = body as Record<string, unknown>;
    if (typeof o.share_uuid === "string") return o.share_uuid;
    const inner = o.data;
    if (
      inner &&
      typeof inner === "object" &&
      typeof (inner as { share_uuid?: string }).share_uuid === "string"
    ) {
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
      setShowManualCopy(false);
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
      setShowManualCopy(false);
      const result = await createShare().unwrap();
      const uuid = extractShareUuid(result);
      if (!uuid || typeof window === "undefined") {
        notify.error("Unable to generate share link");
        return;
      }
      const url = `${window.location.origin}/cv/${uuid}`;
      setShareUrl(url);
      copied = await copyTextToClipboardAsync(url);
      if (copied) {
        notify.success("Link copied to clipboard!");
        setShowManualCopy(false);
      } else {
        setShowManualCopy(true);
        if (!isSafariLike()) {
          notify.error(`Could not copy automatically. Use this link: ${url}`);
        }
      }
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "data" in e &&
        (e as { data?: { message?: string } }).data?.message;
      notify.error(
        typeof msg === "string" ? msg : "Unable to generate share link",
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleManualCopy = () => {
    if (!shareUrl) return;
    setManualCopyLoading(true);
    try {
      // IMPORTANT: synchronous path for Safari clipboard restrictions.
      const copied = execCommandCopy(shareUrl);
      if (copied) {
        notify.success("Link copied to clipboard!");
        setShowManualCopy(false);
      } else {
        if (!isSafariLike()) {
          notify.error(
            `Could not copy automatically. Use this link: ${shareUrl}`,
          );
        }
        setShowManualCopy(true);
      }
    } finally {
      setManualCopyLoading(false);
    }
  };

  const isInitialLoading = !sessionReady || (isLoading && !data);
  const shouldShowLoadingSkeleton = isInitialLoading || (!error && !data);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TenantUniversalHeader
        showPreferencesButton={true}
        showTenantCvLink={false}
        showFavouritesButton={false}
        preferencesCount={preferencesFilledCount}
      />

      <main className="flex-1">
        <div className="lg:max-w-6xl mx-auto lg:px-4 sm:px-6 lg:px-8 pt-18 pb-10 mt-6">
          {shouldShowLoadingSkeleton ? (
            <div className="h-[calc(100vh-130px)] min-h-[520px] overflow-hidden">
              <TenantCvSkeleton />
            </div>
          ) : null}
          {!shouldShowLoadingSkeleton && error ? (
            <div className="h-[calc(100vh-220px)] min-h-[520px] flex items-center justify-center text-center text-red-600">
              {error}
            </div>
          ) : null}
          {!shouldShowLoadingSkeleton && !error && data ? (
            <div className="transition-opacity duration-300 opacity-100">
              <TenantCvView
                data={data}
                shareUrl={shareUrl}
                onShareClick={handleShare}
                shareLoading={shareLoading}
                onManualCopyClick={handleManualCopy}
                showManualCopy={showManualCopy}
                manualCopyLoading={manualCopyLoading}
              />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
