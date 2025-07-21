"use client";

import React from "react";

export default function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      {/* Image Section Skeleton */}
      <div className="relative h-48 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]">
        {/* Pulse animation overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slideIn_1.5s_infinite]"></div>
        
        {/* Shortlist Button Skeleton */}
        <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-slate-300 animate-pulse"></div>
        
        {/* Badge Skeleton */}
        <div className="absolute bottom-3 left-3 w-16 h-6 bg-slate-300 rounded-md animate-pulse"></div>
      </div>

      {/* Content Section Skeleton */}
      <div className="p-5 space-y-4">
        {/* Title and Price Skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded-md animate-pulse"></div>
          <div className="flex items-center justify-between">
            <div className="h-8 w-24 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="h-4 w-16 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Location Skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-slate-200 rounded-md animate-pulse"></div>
        </div>

        {/* Property Details Skeleton */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Features Tags Skeleton */}
        <div className="flex gap-2 flex-wrap">
          <div className="h-6 w-16 bg-slate-200 rounded-md animate-pulse"></div>
          <div className="h-6 w-20 bg-slate-200 rounded-md animate-pulse"></div>
          <div className="h-6 w-14 bg-slate-200 rounded-md animate-pulse"></div>
          <div className="h-6 w-12 bg-slate-200 rounded-md animate-pulse"></div>
        </div>

        {/* Bottom Row Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-slate-200 rounded-md animate-pulse"></div>
          <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
} 