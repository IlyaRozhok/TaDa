"use client";

import React, { useEffect, useState } from "react";
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
import UniversalHeader from "../../components/UniversalHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Heart, ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { waitForSessionManager } from "../../components/providers/SessionManager";

export default function ShortlistPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [sessionReady, setSessionReady] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingShortlist, setClearingShortlist] = useState(false);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const properties = useSelector(selectShortlistProperties);
  const loading = useSelector(selectShortlistLoading);
  const error = useSelector(selectShortlistError);
  const count = useSelector(selectShortlistCount);

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

  // Fetch shortlist on component mount (only after session is ready)
  useEffect(() => {
    if (sessionReady && isAuthenticated && user && user.role === "tenant") {
      dispatch(fetchShortlist());
    }
  }, [dispatch, sessionReady, isAuthenticated, user]);

  // Redirect if not authenticated or not a tenant (only after session is ready)
  useEffect(() => {
    if (!sessionReady) return; // Don't redirect until session is ready

    if (!isAuthenticated || !user) {
      router.push("/");
      return;
    }

    if (user.role !== "tenant") {
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
        <UniversalHeader />
        <div className="max-w-[92%] mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading your shortlist...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <UniversalHeader />
        <div className="max-w-[92%] mx-auto px-4 py-8">
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
      <UniversalHeader />

      <div className="max-w-[92%] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/app/dashboard/tenant")}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Your Shortlist
                  </h1>
                  <p className="text-slate-600">
                    Properties you've saved for later viewing ({count}{" "}
                    {count === 1 ? "property" : "properties"})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>

                {properties.length > 0 && (
                  <button
                    onClick={handleClearShortlist}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <PropertyGridWithLoader
          properties={properties}
          loading={loading}
          onPropertyClick={(property) => handlePropertyClick(property.id)}
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
                onClick={() => router.push("/app/properties")}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                Browse All Properties
              </button>
              <button
                onClick={() => router.push("/app/dashboard/tenant")}
                className="bg-white border border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {properties.length > 0 && (
          <div className="mt-12 bg-slate-100 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Helpful Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-slate-900 mb-2">
                  Compare Properties
                </p>
                <p>
                  Click on any property to view detailed information and
                  features.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-slate-900 mb-2">
                  Remove Properties
                </p>
                <p>
                  Visit a property's detail page to remove it from your
                  shortlist.
                </p>
              </div>
            </div>
          </div>
        )}

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
