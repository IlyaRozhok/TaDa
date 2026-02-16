"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUser,
} from "../../store/slices/authSlice";
import {
  fetchShortlist,
  clearShortlist,
  selectShortlistProperties,
  selectShortlistLoading,
  selectShortlistError,
  selectShortlistCount,
  clearError,
} from "../../store/slices/shortlistSlice";
import { AppDispatch } from "../../store/store";
import PropertyGridWithLoader from "../../components/PropertyGridWithLoader";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ShortlistPageSkeleton from "../../components/ui/ShortlistPageSkeleton";
import { Heart, ChevronDown, Map } from "lucide-react";
import { waitForSessionManager } from "../../components/providers/SessionManager";
import { Property } from "../../types";

type SortOption =
  | "bestMatch"
  | "lowPrice"
  | "highPrice"
  | "lowDeposit"
  | "highDeposit"
  | "dateAdded";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "bestMatch", label: "Best Match Score" },
  { value: "lowPrice", label: "Low price" },
  { value: "highPrice", label: "High Price" },
  { value: "lowDeposit", label: "Low Deposit" },
  { value: "highDeposit", label: "High Deposit" },
  { value: "dateAdded", label: "Date Added" },
];

function SortDropdown({
  sortBy,
  onSortChange,
}: {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ??
    "Best Match Score";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        aria-label="Sort by"
      >
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 rounded-xl min-w-[200px] z-50 bg-white border border-gray-200 shadow-lg overflow-hidden">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full cursor-pointer px-4 py-2.5 text-sm text-left transition-colors ${
                sortBy === option.value
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function sortProperties(properties: Property[], sortBy: SortOption): Property[] {
  const copy = [...properties];
  switch (sortBy) {
    case "bestMatch":
      return copy;
    case "lowPrice":
      return copy.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "highPrice":
      return copy.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "lowDeposit":
      return copy.sort((a, b) => (a.deposit || 0) - (b.deposit || 0));
    case "highDeposit":
      return copy.sort((a, b) => (b.deposit || 0) - (a.deposit || 0));
    case "dateAdded":
      return copy.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    default:
      return copy;
  }
}

export default function ShortlistPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [sessionReady, setSessionReady] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingShortlist, setClearingShortlist] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("bestMatch");

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const properties = useSelector(selectShortlistProperties);
  const loading = useSelector(selectShortlistLoading);
  const error = useSelector(selectShortlistError);
  const count = useSelector(selectShortlistCount);

  const sortedProperties = useMemo(
    () => sortProperties(properties, sortBy),
    [properties, sortBy]
  );

  // Wait for session manager to initialize
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await waitForSessionManager();
        setSessionReady(true);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setSessionReady(true); // Continue anyway
      }
    };
    initializeSession();
  }, []);

  // Fetch shortlist on component mount (tenant and admin can use shortlist)
  useEffect(() => {
    if (
      sessionReady &&
      isAuthenticated &&
      user &&
      (user.role === "tenant" || user.role === "admin")
    ) {
      dispatch(fetchShortlist());
    }
  }, [dispatch, sessionReady, isAuthenticated, user]);

  // Redirect if not authenticated or role cannot access shortlist (only after session is ready)
  useEffect(() => {
    if (!sessionReady) return; // Don't redirect until session is ready

    if (!isAuthenticated || !user) {
      router.push("/");
      return;
    }

    // Tenant and admin can access shortlist; others go to dashboard
    if (user.role !== "tenant" && user.role !== "admin") {
      router.push("/app/dashboard");
      return;
    }
  }, [sessionReady, isAuthenticated, user, router]);

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/app/properties/${propertyId}`);
  };

  const handleRefresh = () => {
    dispatch(clearError());
    dispatch(fetchShortlist());
  };

  const handleClearShortlist = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = async () => {
    setClearingShortlist(true);
    try {
      await dispatch(clearShortlist()).unwrap();
      setShowClearModal(false);
    } catch (error) {
      console.error("Failed to clear shortlist:", error);
    } finally {
      setClearingShortlist(false);
    }
  };

  const handleCloseClearModal = () => {
    if (!clearingShortlist) {
      setShowClearModal(false);
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchShortlist());
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TenantUniversalHeader showPreferencesButton={true} />
        <ShortlistPageSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TenantUniversalHeader showPreferencesButton={true} />
        <div className="max-w-[98%] sm:max-w-[95%] lg:max-w-[92%] mx-auto px-1 sm:px-1.5 lg:px-1 py-1 sm:py-1.5 lg:py-2">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Shortlist
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while session is initializing
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Initializing session...</p>
        </div>
      </div>
    );
  }

  // Show not authenticated state (only after session is ready)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TenantUniversalHeader />

      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-8">
        {/* Header: title, subtitle, sort + show map */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Favourites
            </h1>
            <p className="text-gray-600">
              Review and compare your saved properties to find the perfect match
              {" – "}
              {count} {count === 1 ? "property" : "properties"}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Show map"
            >
              <Map className="w-4 h-4" />
              Show map
            </button>
          </div>
        </div>

        {/* Properties Grid – same cards as property list */}
        <PropertyGridWithLoader
          properties={sortedProperties}
          loading={loading}
          onPropertyClick={(property) => handlePropertyClick(property.id)}
          showShortlist={true}
        />

        {!loading && properties.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Your shortlist is empty
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Start browsing properties and save the ones you're interested in.
              They'll appear here for easy access later.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/app/units")}
                className="bg-white border cursor-pointer border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Tips Section */}

        {/* Clear Shortlist Confirmation Modal */}
        <ConfirmModal
          isOpen={showClearModal}
          onClose={handleCloseClearModal}
          onConfirm={handleConfirmClear}
          title="Clear Entire Shortlist"
          message={`Are you sure you want to remove all ${count} ${
            count === 1 ? "property" : "properties"
          } from your shortlist? This action cannot be undone.`}
          confirmText="Clear All"
          cancelText="Keep Shortlist"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          icon="heart"
          loading={clearingShortlist}
        />
      </div>
    </div>
  );
}
