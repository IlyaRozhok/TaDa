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
import { usePropertyMatches } from "../../hooks/usePropertyMatches";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import ListedPropertiesSection, {
  type SortOption,
} from "../../components/ListedPropertiesSection";
import { waitForSessionManager } from "../../components/providers/SessionManager";
import { useGetMatchedPropertiesQuery } from "@/store/api/matching.api";
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

  // The best-match dataset. Search and page are query arguments, so typing or
  // paging refetches through the cache instead of an imperative loader.
  //
  // It is subscribed under every sort, not only its own, because its envelope
  // carries `avgMatchScore` — the mean over the whole matched set, which
  // `results_viewed` reports whatever the feed is sorted by. Under another sort
  // only that number is read, and the arguments are pinned to page 1: the
  // aggregate is page-independent, so the entry the default view already
  // populated is reused rather than a second one being fetched per page turn.
  const {
    data: bestMatchData,
    isFetching: bestMatchLoading,
    error: bestMatchError,
  } = useGetMatchedPropertiesQuery(
      {
        page: sortBy === "bestMatch" ? bestMatchPage : 1,
        limit: 12,
        search: debouncedSearch || undefined,
      },
      { skip: state.sessionLoading },
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

  /**
   * The population behind `avg_match_score`: the match score of every item of
   * the loaded feed that has actually resolved.
   *
   * `null` means "not resolved yet" and holds the event back. The distinction
   * has to be made here because 0 is a valid score: an item defaulted to 0 by
   * the mappings above is indistinguishable from a genuine zero match once
   * averaged. So this reads the payloads — the best-match response and the
   * score map — rather than `bestMatchProperties` / `propertiesWithMatchScores`,
   * both of which substitute 0 for a missing score so the cards can render.
   *
   * This is the fallback population, not the reported one: the server now sends
   * `avgMatchScore` over the whole matched set, and that is what the event
   * carries. These page-level scores are what `resolveAvgMatchScore` falls back
   * to when the aggregate is missing — an older payload, or a set with nothing
   * to average. They still gate the event: an unresolved page means the feed
   * itself has not settled, whatever the aggregate says.
   */
  const feedMatchScores = useMemo<number[] | null>(() => {
    if (sortBy === "bestMatch") {
      if (!bestMatchData) {
        // A failed load renders an empty grid — a real, empty feed rather than
        // an unresolved one. Anything else is still in flight.
        return bestMatchError ? [] : null;
      }

      return bestMatchData.data
        .filter((item) => item.property?.id)
        .map((item) => item.matchScore)
        .filter((score): score is number => typeof score === "number");
    }

    // Every other sort scores the page through `usePropertyMatches`, so a score
    // counts as resolved only once its id is in that map.
    if (propertyIdsForMatches.length === 0) {
      return [];
    }

    if (matchScoresLoading) {
      return null;
    }

    const resolved = propertyIdsForMatches
      .map((id) => matchByPropertyId[id]?.matchScore)
      .filter((score): score is number => typeof score === "number");

    // An empty map is what a user with no preferences gets back. The 0 that
    // would follow is fabricated, not measured, so the event waits instead.
    return resolved.length ? resolved : null;
  }, [
    sortBy,
    bestMatchData,
    bestMatchError,
    propertyIdsForMatches,
    matchByPropertyId,
    matchScoresLoading,
  ]);

  // The best-match payload carries its own scores; every other sort fetches
  // them separately, so the event waits for that request rather than reporting
  // an average of zeros. Under those sorts it also waits for the matched-set
  // envelope, which is where the aggregate comes from — settling on an error
  // rather than hanging, since the fallback below covers a failed load.
  const matchedSetSettled =
    !bestMatchLoading && Boolean(bestMatchData || bestMatchError);

  const feedLoading =
    sortBy === "bestMatch"
      ? bestMatchLoading || (!bestMatchData && !bestMatchError)
      : state.loading || matchScoresLoading || !matchedSetSettled;

  // The aggregate over the whole matched set, as the server computed it. It is
  // a property of the tenant and the search, not of the sort, so the same
  // number describes every sort of the same feed.
  const feedAvgMatchScore = bestMatchData?.avgMatchScore;

  const feedCount =
    sortBy === "bestMatch" ? (bestMatchData?.total ?? 0) : state.totalCount;

  const feedPage = sortBy === "bestMatch" ? bestMatchPage : state.currentPage;

  useEffect(() => {
    if (feedLoading || feedMatchScores === null) {
      return;
    }

    const feedKey = `${sortBy}|${feedPage}|${debouncedSearch}`;

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
    feedPage,
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
        onSearchChange={handleSearchChange}
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
