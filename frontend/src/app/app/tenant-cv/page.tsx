"use client";

import React, { useEffect, useState, useCallback } from "react";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import { TenantCvView } from "../../components/tenant-cv/TenantCvView";
import { tenantCvAPI } from "../../lib/api";
import { TenantCvResponse } from "../../types/tenantCv";

export default function TenantCvPage() {
  const [data, setData] = useState<TenantCvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const fetchCv = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantCvAPI.getMine();
      const cvData = response.data as TenantCvResponse;
      setData(cvData);
      if (cvData.share_uuid && typeof window !== "undefined") {
        setShareUrl(`${window.location.origin}/cv/${cvData.share_uuid}`);
      }
    } catch (err) {
      setError("Failed to load CV");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCv();
  }, [fetchCv]);

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
        showPreferencesButton={false}
        showFavouritesButton={false}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 mt-6">
        {loading && (
          <div className="py-16 text-center text-gray-600">Loading CV...</div>
        )}
        {error && <div className="py-16 text-center text-red-600">{error}</div>}
        {data && !loading ? (
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
