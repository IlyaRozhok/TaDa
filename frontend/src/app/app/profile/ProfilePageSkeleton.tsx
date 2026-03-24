"use client";

import React from "react";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import Footer from "../../components/Footer";

export default function ProfilePageSkeleton() {
  return (
    <>
      <TenantUniversalHeader showPreferencesButton={true} />

      <div className="max-w-4xl mx-auto px-5 pb-32 pt-0 min-h-[calc(100vh-180px)]">
        <div className="animate-pulse space-y-8">
          <div className="space-y-4">
            <div className="h-9 w-64 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-12 w-full rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-28 w-full rounded-xl bg-gray-200" />
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="h-12 w-36 rounded-full bg-gray-200" />
            <div className="h-12 w-28 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
