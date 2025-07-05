"use client";

import React from "react";
import { Home } from "lucide-react";

interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
}

export default function GlobalLoader({
  isLoading,
  message = "Loading...",
}: GlobalLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Home className="w-8 h-8 text-white" />
        </div>

        {/* Brand */}
        <h1 className="text-2xl font-bold text-slate-900 mb-8">TaDa</h1>

        {/* Loading Animation */}
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-6"></div>

        {/* Message */}
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
