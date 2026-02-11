"use client";

import React from "react";

interface OnboardingIntroCenteredWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that strictly centers its content horizontally and vertically
 * within the available onboarding intro area (above the fixed bottom nav).
 */
export default function OnboardingIntroCenteredWrapper({
  children,
  className = "",
}: OnboardingIntroCenteredWrapperProps) {
  return (
    <div
      className={`flex flex-1 min-h-0 flex-col items-center justify-center w-full ${className}`.trim()}
    >
      {children}
    </div>
  );
}
