"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { shortlistAPI, Property } from "../../lib/api";
import { useTranslations } from "../../lib/language-context";
import PropertyCard from "../../components/PropertyCard";
import DashboardHeader from "../../components/DashboardHeader";
import { Heart, ArrowLeft } from "lucide-react";

export default function ShortlistPage() {
  const router = useRouter();
  const t = useTranslations();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShortlist = async () => {
      try {
        setLoading(true);
        const shortlistedProperties = await shortlistAPI.getAll();
        setProperties(shortlistedProperties);
      } catch (err) {
        console.error("Error fetching shortlist:", err);
        setError("Failed to load your shortlist");
      } finally {
        setLoading(false);
      }
    };

    fetchShortlist();
  }, []);

  const handlePropertyClick = (property: Property) => {
    router.push(`/app/properties/${property.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Shortlist
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
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
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Your Shortlist
                </h1>
                <p className="text-slate-600">
                  Properties you've saved for later viewing ({properties.length}{" "}
                  {properties.length === 1 ? "property" : "properties"})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => handlePropertyClick(property)}
              />
            ))}
          </div>
        ) : (
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
      </div>
    </div>
  );
}
