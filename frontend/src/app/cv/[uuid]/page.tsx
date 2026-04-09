"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { tenantCvAPI } from "../../lib/api";
import { TenantCvResponse } from "../../types/tenantCv";
import { TenantCvView } from "../../components/tenant-cv/TenantCvView";
import Footer from "../../components/Footer";
import UserDropdown from "../../components/UserDropdown";
import { selectIsAuthenticated } from "../../store/slices/authSlice";
import { useTranslation } from "../../hooks/useTranslation";
import { onboardingKeys } from "../../lib/translationsKeys/onboardingTranslationKeys";

export default function PublicTenantCvPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { t } = useTranslation();
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
          className="transition-opacity hover:opacity-80 cursor-pointer"
        >
          <img
            src="/black-logo.svg"
            alt="TADA Logo"
            className="h-7 sm:h-8"
          />
        </button>
        {isAuthenticated ? (
          <UserDropdown />
        ) : (
          <button
            onClick={() => router.push("/app/auth")}
            className="bg-black cursor-pointer text-white px-3 sm:px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:bg-black/80 transition-colors font-medium text-xs sm:text-sm flex-shrink-0"
          >
            {t(onboardingKeys.headerCtaGetStarted)}
          </button>
        )}
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

      <Footer />
    </div>
  );
}

