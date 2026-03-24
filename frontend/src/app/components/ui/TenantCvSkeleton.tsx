"use client";

import React from "react";

export default function TenantCvSkeleton() {
  return (
    <div className="animate-pulse pb-20">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="w-full space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-56 rounded bg-gray-200" />
              <div className="h-10 w-24 rounded-full bg-gray-200" />
              <div className="h-10 w-28 rounded-full bg-gray-200" />
              <div className="h-10 w-36 rounded-full bg-gray-200" />
            </div>
            <div className="h-4 w-72 rounded bg-gray-200" />
            <div className="h-4 w-96 rounded bg-gray-200" />
          </div>
        </div>

        <div className="h-[15px] bg-gray-100/70 w-full rounded-3xl" />

        <div className="flex flex-wrap gap-3">
          <div className="h-12 w-72 rounded-full bg-gray-200" />
          <div className="h-12 w-64 rounded-full bg-gray-200" />
        </div>

        <div className="space-y-6 mt-4">
          <div className="h-8 w-44 rounded bg-gray-200" />
          <div className="h-14 w-64 rounded bg-gray-200" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-gray-200" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-gray-200" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-gray-200" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="h-7 w-40 rounded bg-gray-200" />
          <div className="h-24 rounded bg-gray-200" />
          <div className="h-7 w-52 rounded bg-gray-200" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-24 rounded bg-gray-200" />
            <div className="h-24 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
