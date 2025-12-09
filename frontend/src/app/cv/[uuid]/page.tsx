"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { tenantCvAPI } from "../../lib/api";
import { TenantCvResponse } from "../../types/tenantCv";
import { TenantCvView } from "../../components/tenant-cv/TenantCvView";

export default function PublicTenantCvPage() {
  const params = useParams();
  const router = useRouter();
  const shareUuid = (params?.uuid as string) || "";

  const [data, setData] = useState<TenantCvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCv = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantCvAPI.getPublic(shareUuid);
      setData(response.data as TenantCvResponse);
    } catch (err) {
      setError("Profile not available");
    } finally {
      setLoading(false);
    }
  }, [shareUuid]);

  useEffect(() => {
    if (shareUuid) {
      fetchCv();
    } else {
      setError("Missing CV link");
      setLoading(false);
    }
  }, [shareUuid, fetchCv]);

  return (
    <div className="min-h-screen bg-white">
      <nav className="w-full border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-xl font-semibold text-gray-900"
        >
          TADA
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading && (
          <div className="py-16 text-center text-gray-600">
            Loading profile...
          </div>
        )}
        {error && <div className="py-16 text-center text-red-600">{error}</div>}
        {data && !loading ? <TenantCvView data={data} /> : null}
      </div>
    </div>
  );
}

