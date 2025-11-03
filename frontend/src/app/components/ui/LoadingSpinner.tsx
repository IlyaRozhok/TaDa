"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  variant?: "default" | "overlay" | "inline";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export default function LoadingSpinner({
  size = "md",
  className = "",
  text,
  variant = "overlay",
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn("animate-spin text-black", sizeClasses[size], className)}
    />
  );

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="bg-white/80 rounded-lg p-6 flex flex-col items-center space-y-3">
          {spinner}
          {text && <p className="text-sm text-gray-800 text-center">{text}</p>}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center space-x-2">
        {spinner}
        {text && <span className="text-sm text-gray-600">{text}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {spinner}
      {text && <p className="text-sm text-gray-600 text-center">{text}</p>}
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: "text" | "card" | "list";
}

export function LoadingSkeleton({
  className = "",
  lines = 3,
  variant = "text",
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
        <div className="space-y-3">
          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
          <div className="bg-gray-200 h-4 rounded w-1/2"></div>
          <div className="bg-gray-200 h-4 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse bg-gray-200 h-4 rounded"
            style={{
              width: `${Math.random() * 40 + 60}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-gray-200 h-4 rounded"
          style={{
            width: `${Math.random() * 40 + 60}%`,
          }}
        />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  text?: string;
  className?: string;
}

export function LoadingPage({
  text = "Loading...",
  className = "",
}: LoadingPageProps) {
  return (
    <div
      className={cn("min-h-screen flex items-center justify-center", className)}
    >
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-lg text-gray-600">{text}</p>
      </div>
    </div>
  );
}
