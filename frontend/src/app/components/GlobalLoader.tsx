"use client";

import React from "react";
import PageSkeleton from "./ui/PageSkeleton";

interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
}

export default function GlobalLoader({
  isLoading,
  message,
}: GlobalLoaderProps) {
  if (!isLoading) return null;

  // Use PageSkeleton instead of spinner
  return <PageSkeleton />;
}
