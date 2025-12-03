"use client";

import React from "react";
import PropertyCardSkeleton from "../PropertyCardSkeleton";

export default function ShortlistPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header section - will be rendered by UniversalHeader */}
      <div className="max-w-[92%] mx-auto px-4 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-5 w-40 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Header Card Skeleton */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Icon Skeleton */}
                <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                <div>
                  {/* Title Skeleton */}
                  <div className="h-9 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
                  {/* Description Skeleton */}
                  <div className="h-5 w-80 bg-slate-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

