"use client";

import React, { useEffect, useState, useCallback } from "react";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import { TenantCvView } from "../../components/tenant-cv/TenantCvView";
import { tenantCvAPI } from "../../lib/api";
import { TenantCvResponse } from "../../types/tenantCv";
import { useGetTenantCvQuery } from "../../store/slices/apiSlice";

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
  } = useGetTenantCvQuery();

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
    try {
      setShareLoading(true);
      const response = await tenantCvAPI.createShare();
      const uuid = response.data?.share_uuid;
      if (uuid && typeof window !== "undefined") {
        const url = `${window.location.origin}/cv/${uuid}`;
        setShareUrl(url);
        await navigator.clipboard?.writeText(url);
        setShareMessage("Share link copied to clipboard");
      }
    } catch (err) {
      setShareMessage("Unable to generate share link");
    } finally {
      setShareLoading(false);
      setTimeout(() => setShareMessage(null), 2500);
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
