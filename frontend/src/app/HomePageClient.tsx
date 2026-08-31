"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "@/store/slices/authSlice";
import PropertyCardSkeleton from "@/entities/property/ui/PropertyCardSkeleton";
import AuthModal from "./components/AuthModal";
import DualLandingWrapper from "./components/DualLandingWrapper";

export default function HomePageClient() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(`/app/units/`);
    }
  }, [isAuthenticated, user, router]);

  const handleSignIn = () => {
    setAuthModalOpen(true);
  };


  // Show loading state while redirecting authenticated users
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1 max-w-md mx-8 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-[92%] mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <PropertyCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // The authenticated branch that used to follow was unreachable — signed-in
  // users are redirected above and get the skeleton below — and it carried a
  // fabricated match-score generator. The landing is the page.
  return (
    <div className="min-h-screen bg-white">
      <DualLandingWrapper onSignIn={handleSignIn} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
