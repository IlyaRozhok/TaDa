"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { useTenantDashboard } from "../../hooks/useTenantDashboard";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import TenantPerfectMatchSection from "../../components/TenantPerfectMatchSection";
import ListedPropertiesSection from "../../components/ListedPropertiesSection";
import { waitForSessionManager } from "../../components/providers/SessionManager";

function TenantDashboardContent() {
  const user = useSelector(selectUser);
  const { state, setSearchTerm, loadProperties, clearError } =
    useTenantDashboard();

  // Handle search term changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // Loading state
  if (!user || state.sessionLoading) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          searchTerm={state.searchTerm || ""}
          onSearchChange={handleSearchChange}
          showSearchInput={true}
        />

        {/* Main Content */}
        <main className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Perfect Match Section - show skeleton while loading preferences */}
          {state.preferencesLoading ? (
            <section className="bg-gray-50 rounded-3xl px-25 py-12 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="animate-pulse">
                    <div className="h-10 w-96 bg-gray-200 rounded mb-4"></div>
                    <div className="h-5 w-full max-w-2xl bg-gray-200 rounded mb-2"></div>
                    <div className="h-5 w-3/4 max-w-xl bg-gray-200 rounded mb-8"></div>
                    <div className="h-12 w-48 bg-gray-200 rounded-3xl"></div>
                  </div>
                </div>

                {/* Illustration Skeleton */}
                <div className="hidden lg:block">
                  <div className="animate-pulse">
                    <div className="w-64 h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            !state.hasCompletePreferences && (
              <TenantPerfectMatchSection
                hasPreferences={
                  !!state.userPreferences && state.preferencesCount > 0
                }
                preferencesCount={state.preferencesCount}
              />
            )
          )}

          {/* Listed Properties Section */}
          <ListedPropertiesSection
            properties={[]}
            matchedProperties={[]}
            loading={true}
            userPreferences={state.userPreferences}
            totalCount={0}
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        </main>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={clearError}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <TenantUniversalHeader
        searchTerm={state.searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* Main Content */}
      <main className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Perfect Match Section - only show if preferences are NOT complete and loaded */}
        {!state.preferencesLoading && !state.hasCompletePreferences && (
          <TenantPerfectMatchSection
            hasPreferences={
              !!state.userPreferences && state.preferencesCount > 0
            }
            preferencesCount={state.preferencesCount}
          />
        )}

        {/* Listed Properties Section */}
        <ListedPropertiesSection
          properties={state.properties}
          matchedProperties={state.matchedProperties}
          loading={state.loading}
          userPreferences={state.userPreferences}
          totalCount={state.totalCount}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          onPageChange={(page) => loadProperties(state.searchTerm, page)}
        />
      </main>
    </div>
  );
}

export default function TenantUnitsPage() {
  const user = useSelector(selectUser);
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        await waitForSessionManager();
      } catch (error) {
        console.error("Failed to wait for session manager:", error);
      } finally {
        if (isMounted) {
          setSessionReady(true);
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (!user) {
      router.replace("/");
    }
  }, [sessionReady, user, router]);

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          searchTerm=""
          onSearchChange={() => {}}
          showSearchInput={true}
        />

        {/* Main Content */}
        <main className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Perfect Match Section Skeleton */}
          <section className="bg-gray-50 rounded-3xl px-25 py-12 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="animate-pulse">
                  <div className="h-10 w-96 bg-gray-200 rounded mb-4"></div>
                  <div className="h-5 w-full max-w-2xl bg-gray-200 rounded mb-2"></div>
                  <div className="h-5 w-3/4 max-w-xl bg-gray-200 rounded mb-8"></div>
                  <div className="h-12 w-48 bg-gray-200 rounded-3xl"></div>
                </div>
              </div>

              {/* Illustration Skeleton */}
              <div className="hidden lg:block">
                <div className="animate-pulse">
                  <div className="w-64 h-48 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Listed Properties Section */}
          <ListedPropertiesSection
            properties={[]}
            matchedProperties={[]}
            loading={true}
            userPreferences={undefined}
            totalCount={0}
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          searchTerm=""
          onSearchChange={() => {}}
          showSearchInput={true}
        />

        {/* Main Content */}
        <main className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Perfect Match Section Skeleton */}
          <section className="bg-gray-50 rounded-3xl px-25 py-12 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="animate-pulse">
                  <div className="h-10 w-96 bg-gray-200 rounded mb-4"></div>
                  <div className="h-5 w-full max-w-2xl bg-gray-200 rounded mb-2"></div>
                  <div className="h-5 w-3/4 max-w-xl bg-gray-200 rounded mb-8"></div>
                  <div className="h-12 w-48 bg-gray-200 rounded-3xl"></div>
                </div>
              </div>

              {/* Illustration Skeleton */}
              <div className="hidden lg:block">
                <div className="animate-pulse">
                  <div className="w-64 h-48 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Listed Properties Section */}
          <ListedPropertiesSection
            properties={[]}
            matchedProperties={[]}
            loading={true}
            userPreferences={undefined}
            totalCount={0}
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        </main>
      </div>
    );
  }

  // Redirect non-tenants
  if (user && user.role !== "tenant") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            This page is only accessible to tenant users.
          </p>
        </div>
      </div>
    );
  }

  return <TenantDashboardContent />;
}

