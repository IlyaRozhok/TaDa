"use client";

import React from "react";

export default function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Title and Address Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Gallery and Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Gallery Skeleton */}
          <div className="lg:col-span-2">
            {/* Main Image Skeleton */}
            <div className="relative rounded-2xl overflow-hidden mb-4">
              <div className="h-96 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                {/* Badge Skeleton */}
                <div className="absolute top-4 left-4 h-8 w-24 bg-gray-300 rounded-lg animate-pulse"></div>
                {/* Photo Counter Skeleton */}
                <div className="absolute top-4 right-4 h-6 w-16 bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Details Section Skeleton */}
            <div className="mt-8">
              <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="bg-white rounded-2xl border p-6">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-8">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index}>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="rounded-xl">
              {/* Owner Info Skeleton */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Availability Skeleton */}
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>

              {/* Price and Booking Skeleton */}
              <div className="p-3">
                <div className="flex items-center mb-2">
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mr-3"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-6"></div>

                {/* Payment Breakdown Skeleton */}
                <div className="border-t pt-4">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex justify-between">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section Skeleton */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Amenities Section Skeleton */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Location Section Skeleton */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="rounded-2xl overflow-hidden border h-96 bg-gray-200 animate-pulse"></div>
      </div>
    </div>
  );
}

