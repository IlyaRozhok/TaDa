"use client";

import React, { useEffect, useState } from "react";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import { TenantCvView } from "../../components/tenant-cv/TenantCvView";
import { TenantCvResponse } from "../../types/tenantCv";
import {
  useGetTenantCvQuery,
  useCreateTenantCvShareMutation,
} from "../../store/slices/apiSlice";

export default function TenantCvPage() {
  const [data, setData] = useState<TenantCvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  // Load tenant CV via RTK Query with 5‑минутным кэшем
  const {
    data: cvQueryData,
    isLoading,
    isFetching,
    error: cvQueryError,
  } = useGetTenantCvQuery(undefined);

  const [createShare] = useCreateTenantCvShareMutation();

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
        setShareMessage("Unable to generate share link");
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
      setShareMessage(
        copied
          ? "Share link copied to clipboard"
          : `Copy this link: ${url}`
      );
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "data" in e &&
        (e as { data?: { message?: string } }).data?.message;
      setShareMessage(
        typeof msg === "string" ? msg : "Unable to generate share link",
      );
    } finally {
      setShareLoading(false);
      setTimeout(() => setShareMessage(null), copied ? 2500 : 5000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        showPreferencesButton={true}
        showTenantCvLink={false}
        showFavouritesButton={false}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 pb-10 mt-6">
        {/* Показываем лоадер только на самом первом запросе, когда нет данных в кэше */}
        {isLoading && !data && (
          <div className="py-16 text-center text-gray-600">Loading CV...</div>
        )}
        {error && <div className="py-16 text-center text-red-600">{error}</div>}
        {data && !isLoading ? (
          <>
            {shareMessage && (
              <div className="mb-4 rounded-xl bg-black text-white px-4 py-3 text-sm">
                {shareMessage}
              </div>
            )}
            <TenantCvView
              data={data}
              shareUrl={shareUrl}
              onShareClick={handleShare}
              shareLoading={shareLoading}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
