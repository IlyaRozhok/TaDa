"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  selectOnboardingCompleted,
} from "@/store/slices/authSlice";
import { useTenantDashboard } from "../../hooks/useTenantDashboard";
import { usePropertyMatches } from "../../hooks/usePropertyMatches";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import ListedPropertiesSection, {
  type SortOption,
} from "../../components/ListedPropertiesSection";
import { waitForSessionManager } from "../../components/providers/SessionManager";
import { useGetMatchedPropertiesQuery } from "@/store/api/matching.api";
import { useDebounce } from "../../hooks/useDebounce";
import {
  sanitizeSearchQuery,
  SORT_TYPE_BY_SORT_OPTION,
} from "@/lib/analytics/events";
import { track } from "@/lib/analytics/ga";
import Footer from "../../components/Footer";

function TenantDashboardContent() {
  const user = useSelector(selectUser);
  const { state, loadProperties, clearError, setSearchTerm } =
    useTenantDashboard({
      // Full catalog — matching endpoint applies preference SQL filters and hides many listings.
      useMatchedProperties: false,
      useFullCountForHeader: false,
      persistenceKey: "units-dashboard-filters",
    });

  const [sortBy, setSortBy] = useState<SortOption>("bestMatch");
  const [bestMatchPage, setBestMatchPage] = useState(1);
  const debouncedSearch = useDebounce(state.searchTerm, 300);

  const propertyIdsForMatches = useMemo(
    () =>
      state.matchedProperties
        .map((m) => m.property?.id)
        .filter((id): id is string => Boolean(id)),
    [state.matchedProperties],
  );

  // Only the other sorts need scores fetched: the best-match dataset already
  // carries them, so the default view costs no extra request at all.
  const { matchByPropertyId, loading: matchScoresLoading } = usePropertyMatches(
    propertyIdsForMatches,
    {
      enabled: sortBy !== "bestMatch",
    },
  );

  const propertiesWithMatchScores = useMemo(() => {
    return state.matchedProperties.map((m) => {
      const id = m.property?.id;
      if (!id) return m;
      const extra = matchByPropertyId[id];
      if (!extra) return m;
      return {
        ...m,
        matchScore: extra.matchScore ?? m.matchScore ?? 0,
        categories: extra.matchCategories ?? m.categories,
      };
    });
  }, [state.matchedProperties, matchByPropertyId]);

  // The best-match dataset. Fetches only while it is the one displayed and the
  // session is ready; search and page are query arguments, so typing or paging
  // refetches through the cache instead of an imperative loader.
  const {
    data: bestMatchData,
    isFetching: bestMatchLoading,
    error: bestMatchError,
  } = useGetMatchedPropertiesQuery(
      {
        page: bestMatchPage,
        limit: 12,
        search: debouncedSearch || undefined,
      },
      { skip: state.sessionLoading || sortBy !== "bestMatch" },
    );

  // A new search starts from the first page, as the old loader did.
  useEffect(() => {
    setBestMatchPage(1);
  }, [debouncedSearch]);

  const bestMatchProperties = useMemo(
    () =>
      (bestMatchData?.data ?? [])
        .map((item) => ({
          property: item.property,
          matchScore: item.matchScore ?? 0,
          categories: item.categories ?? [],
        }))
        .filter((item) => item.property?.id),
    [bestMatchData],
  );

  // One results_viewed per distinct feed load — a new sort, page or search is a
  // new load, a re-render of the same one is not.
  const trackedFeedRef = useRef<string | null>(null);

  const feedItems =
    sortBy === "bestMatch" ? bestMatchProperties : propertiesWithMatchScores;

  // The best-match payload carries its own scores; every other sort fetches
  // them separately, so the event waits for that request rather than reporting
  // an average of zeros.
  const feedLoading =
    sortBy === "bestMatch"
      ? bestMatchLoading || (!bestMatchData && !bestMatchError)
      : state.loading || matchScoresLoading;

  const feedCount =
    sortBy === "bestMatch" ? (bestMatchData?.total ?? 0) : state.totalCount;

  const feedPage = sortBy === "bestMatch" ? bestMatchPage : state.currentPage;

  useEffect(() => {
    if (feedLoading) {
      return;
    }

    const feedKey = `${sortBy}|${feedPage}|${debouncedSearch}`;

    if (trackedFeedRef.current === feedKey) {
      return;
    }

    trackedFeedRef.current = feedKey;

    const scores = feedItems
      .map((item) => item.matchScore)
      .filter((score): score is number => typeof score === "number");

    const avgMatchScore = scores.length
      ? Math.round(
          (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10,
        ) / 10
      : 0;

    track({
      name: "results_viewed",
      params: { results_count: feedCount, avg_match_score: avgMatchScore },
    });
  }, [
    feedLoading,
    feedItems,
    feedCount,
    feedPage,
    sortBy,
    debouncedSearch,
  ]);

  // The debounced value, so a typed word is one event rather than one per
  // keystroke. The query is sanitised before it leaves the app.
  useEffect(() => {
    const query = debouncedSearch.trim();

    if (!query) {
      return;
    }

    track({
      name: "search_performed",
      params: { query: sanitizeSearchQuery(query) },
    });
  }, [debouncedSearch]);

  const handleSortChange = (newSort: SortOption) => {
    track({
      name: "results_sorted",
      params: { sort_type: SORT_TYPE_BY_SORT_OPTION[newSort] },
    });
    setSortBy(newSort);
    if (newSort !== "bestMatch") {
      void loadProperties(state.searchTerm, 1);
    }
  };

  const handlePageChange = (page: number) => {
    // When switching pages we always move the user back to the top.
    // Pagination doesn't trigger navigation, so the browser keeps the previous scroll position.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    if (sortBy === "bestMatch") {
      setBestMatchPage(page);
    } else {
      void loadProperties(state.searchTerm, page);
    }
  };

  // Loading state: показываем скелетоны ТОЛЬКО когда нет кэша
  if (!user || (state.sessionLoading && !state.hydratedFromCache)) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          searchTerm={state.searchTerm}
          onSearchChange={setSearchTerm}
          preferencesCount={state.preferencesFilledCount}
        />

        {/* Main Content */}
        <main className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-16">
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
            showShortlistForAllRoles={true}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
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
        <Footer />
      </div>
    );
  }

  const displayProperties =
    sortBy === "bestMatch" ? bestMatchProperties : propertiesWithMatchScores;
  // Loading until the first page arrives; a failed load shows the empty grid,
  // which is what the old imperative loader did.
  const displayLoading =
    sortBy === "bestMatch"
      ? bestMatchLoading || (!bestMatchData && !bestMatchError)
      : state.loading;
  const displayTotalCount =
    sortBy === "bestMatch" ? (bestMatchData?.total ?? 0) : state.totalCount;
  const displayCurrentPage =
    sortBy === "bestMatch" ? bestMatchPage : state.currentPage;
  const displayTotalPages =
    sortBy === "bestMatch" ? (bestMatchData?.totalPages ?? 1) : state.totalPages;

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        searchTerm={state.searchTerm}
        onSearchChange={setSearchTerm}
        preferencesCount={state.preferencesFilledCount}
      />

      {/* Main Content */}
      <main className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-16">
        {/* Listed Properties Section */}
        <ListedPropertiesSection
          properties={displayProperties}
          matchedProperties={displayProperties}
          loading={displayLoading}
          userPreferences={state.userPreferences}
          totalCount={displayTotalCount}
          currentPage={displayCurrentPage}
          totalPages={displayTotalPages}
          onPageChange={handlePageChange}
          showShortlistForAllRoles={true}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      </main>
      <Footer />
    </div>
  );
}

export default function TenantUnitsPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const onboardingCompleted = useSelector(selectOnboardingCompleted);
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

    if (!isAuthenticated || !user) {
      router.replace("/");
      return;
    }

    // Allow admins, operators and tenants to access units page.
    // onboardingCompleted is hydrated from a persisted flag (localStorage) in
    // setUser, so a refresh keeps a completed tenant here instead of bouncing
    // them back to onboarding.
    if (user.role === "tenant" && !onboardingCompleted) {
      router.replace("/app/onboarding");
      return;
    }

    // Redirect roles that should not stay on units.
    if (
      user.role !== "admin" &&
      user.role !== "operator" &&
      user.role !== "tenant"
    ) {
      router.replace("/");
      return;
    }
  }, [sessionReady, isAuthenticated, user, onboardingCompleted, router]);

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader />

        {/* Main Content */}
        <main className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-16">
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
            showShortlistForAllRoles={true}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader />

        {/* Main Content */}
        <main className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-6">
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
            showShortlistForAllRoles={true}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Only allow admins, operators and tenants
  if (
    user &&
    user.role !== "admin" &&
    user.role !== "operator" &&
    user.role !== "tenant"
  ) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600">
              This page is only accessible to admin, operator and tenant users.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <TenantDashboardContent />;
}
