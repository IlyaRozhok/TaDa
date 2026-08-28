"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  selectOnboardingCompleted,
} from "@/store/slices/authSlice";
import { useTenantDashboard } from "../../hooks/useTenantDashboard";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import ListedPropertiesSection from "../../components/ListedPropertiesSection";
import { waitForSessionManager } from "../../components/providers/SessionManager";
import { useGetMatchedPropertiesQuery } from "@/store/api/matching.api";
import {
  MATCHED_SORT_BY_SORT_OPTION,
  type SortOption,
} from "@/app/lib/listingSort";
import { useDebounce } from "../../hooks/useDebounce";
import {
  resolveAvgMatchScore,
  sanitizeSearchQuery,
  SORT_TYPE_BY_SORT_OPTION,
} from "@/lib/analytics/events";
import { track } from "@/lib/analytics/ga";
import Footer from "../../components/Footer";

function TenantDashboardContent() {
  const user = useSelector(selectUser);
  const { state, clearError, setSearchTerm } = useTenantDashboard({
    // The matching endpoint IS the full catalogue now: it ranks every listed
    // property, pre-filtering is opt-in, and `total` is the full listed count.
    // The hook is only here for preferences, the search term and the session
    // gate — the feed below owns the data.
    useMatchedProperties: true,
    useFullCountForHeader: false,
    persistenceKey: "units-dashboard-filters",
  });

  const [sortBy, setSortBy] = useState<SortOption>("bestMatch");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(state.searchTerm, 300);

  // True once the user has typed in the search box. The search box is the only
  // caller of `setSearchTerm`, so nothing else can raise it — which is what
  // keeps `search_performed` off a term restored from sessionStorage.
  const searchTypedRef = useRef(false);

  const handleSearchChange = useCallback(
    (term: string) => {
      searchTypedRef.current = true;
      setSearchTerm(term);
    },
    [setSearchTerm],
  );

  // The whole feed, under every sort. Search, page and sort are query
  // arguments, so typing, paging or re-sorting refetches through the cache
  // instead of an imperative loader — and the server does the ordering across
  // the full listed inventory rather than the page reordering its own twelve
  // rows. The envelope carries each item's real match score and category
  // breakdown, so the badges need no second request.
  const {
    data: feedData,
    isFetching: feedFetching,
    error: feedError,
  } = useGetMatchedPropertiesQuery(
    {
      page,
      limit: 12,
      search: debouncedSearch || undefined,
      sort: MATCHED_SORT_BY_SORT_OPTION[sortBy],
    },
    { skip: state.sessionLoading },
  );

  // A new search starts from the first page, as the old loader did. Re-sorting
  // does too, but that one is reset in `handleSortChange`: it has a user event
  // to hang off, and page 4 of "best match" is not page 4 of "lowest price".
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const feedProperties = useMemo(
    () =>
      (feedData?.data ?? [])
        .map((item) => ({
          property: item.property,
          matchScore: item.matchScore ?? 0,
          categories: item.categories ?? [],
        }))
        .filter((item) => item.property?.id),
    [feedData],
  );

  // One results_viewed per distinct feed load — a new sort, page or search is a
  // new load, a re-render of the same one is not.
  const trackedFeedRef = useRef<string | null>(null);

  /**
   * The population behind `avg_match_score`: the match score of every item of
   * the loaded feed that has actually resolved.
   *
   * `null` means "not resolved yet" and holds the event back. The distinction
   * has to be made here because 0 is a valid score: an item defaulted to 0 by
   * the mappings above is indistinguishable from a genuine zero match once
   * averaged. So this reads the response payload rather than `feedProperties`,
   * which substitutes 0 for a missing score so the cards can render.
   *
   * This is the fallback population, not the reported one: under `best_match`
   * the server sends `avgMatchScore` over the whole scored set, and that is
   * what the event carries. These page-level scores are what
   * `resolveAvgMatchScore` falls back to when the aggregate is missing — an
   * older payload, or a sort the server ordered in SQL without scoring the
   * whole set. They still gate the event: an unresolved page means the feed
   * itself has not settled, whatever the aggregate says.
   */
  const feedMatchScores = useMemo<number[] | null>(() => {
    if (!feedData) {
      // A failed load renders an empty grid — a real, empty feed rather than
      // an unresolved one. Anything else is still in flight.
      return feedError ? [] : null;
    }

    return feedData.data
      .filter((item) => item.property?.id)
      .map((item) => item.matchScore)
      .filter((score): score is number => typeof score === "number");
  }, [feedData, feedError]);

  const feedLoading = feedFetching || (!feedData && !feedError);

  // The aggregate over the whole matched set, as the server computed it. It is
  // `null` under a SQL-ordered sort, where only the returned page was scored —
  // `resolveAvgMatchScore` then reports that page instead of a number the
  // server never measured.
  const feedAvgMatchScore = feedData?.avgMatchScore;

  const feedCount = feedData?.total ?? 0;

  useEffect(() => {
    if (feedLoading || feedMatchScores === null) {
      return;
    }

    const feedKey = `${sortBy}|${page}|${debouncedSearch}`;

    if (trackedFeedRef.current === feedKey) {
      return;
    }

    trackedFeedRef.current = feedKey;

    // The server's full-set mean, or the resolved page as a sample of it. An
    // empty feed reports 0 with a `results_count` of 0 beside it: the mean of
    // nothing, not a score that failed to arrive.
    const avgMatchScore = resolveAvgMatchScore(
      feedAvgMatchScore,
      feedMatchScores,
    );

    track({
      name: "results_viewed",
      params: { results_count: feedCount, avg_match_score: avgMatchScore },
    });
  }, [
    feedLoading,
    feedMatchScores,
    feedAvgMatchScore,
    feedCount,
    page,
    sortBy,
    debouncedSearch,
  ]);

  // The debounced value, so a typed word is one event rather than one per
  // keystroke. The query is sanitised before it leaves the app.
  //
  // The flag is what separates typing from restoration: `state.searchTerm` is
  // seeded from sessionStorage when the feed is re-entered, and that seeded
  // value reaches this debounce exactly as a keystroke would, so by the time it
  // arrives here the two are indistinguishable. Only the input sets the flag.
  useEffect(() => {
    if (!searchTypedRef.current) {
      return;
    }

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
    // The query argument changes with it, so the server re-orders the whole
    // inventory — no second endpoint, no imperative reload.
    setSortBy(newSort);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    // When switching pages we always move the user back to the top.
    // Pagination doesn't trigger navigation, so the browser keeps the previous scroll position.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    setPage(nextPage);
  };

  // Loading state: показываем скелетоны ТОЛЬКО когда нет кэша
  if (!user || (state.sessionLoading && !state.hydratedFromCache)) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          searchTerm={state.searchTerm}
          onSearchChange={handleSearchChange}
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

  // One source for the grid under every sort. `feedLoading` already means
  // "loading until the first page arrives"; a failed load shows the empty
  // grid, which is what the old imperative loader did.
  const displayTotalPages = feedData?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        searchTerm={state.searchTerm}
        onSearchChange={handleSearchChange}
        preferencesCount={state.preferencesFilledCount}
      />

      {/* Main Content */}
      <main className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-16">
        {/* Listed Properties Section */}
        <ListedPropertiesSection
          properties={feedProperties}
          matchedProperties={feedProperties}
          loading={feedLoading}
          userPreferences={state.userPreferences}
          totalCount={feedCount}
          currentPage={page}
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
