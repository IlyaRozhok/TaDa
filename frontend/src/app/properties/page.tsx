"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "../components/PropertyCard";
import { Button } from "../components/ui/Button";
import Logo from "../components/Logo";
import { Search, Home, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Property } from "../types";
import { useProperties } from "../hooks/useProperties";
import { useDebounce } from "../hooks/useDebounce";
import AuthModal from "../components/AuthModal";

export default function PublicPropertiesPage() {
  const router = useRouter();

  // Use the properties hook for public properties
  const { properties, loading, error, searchLoading, fetchPublicProperties } =
    useProperties();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Debounce the search term with 400ms delay to prevent cyclic requests
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Single useEffect to handle all property loading with debounced search
  useEffect(() => {
    const loadProperties = async () => {
      try {
        console.log("🔍 Loading properties with search:", debouncedSearchTerm);
        const result = await fetchPublicProperties(
          page,
          6,
          debouncedSearchTerm
        );
        setTotalPages(1); // Simple pagination for public view
        setTotalProperties(result.length);

        // Show registration prompt if user tries to go beyond first page
        if (page > 1 || result.length >= 6) {
          setShowRegistrationPrompt(true);
        }
      } catch (err: unknown) {
        console.error("Error fetching properties:", err);
      }
    };

    loadProperties();
  }, [debouncedSearchTerm, page]); // Remove fetchPublicProperties from dependencies

  const handlePropertyClick = (property: Property) => {
    router.push(`/properties/${property.id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // Show loading when initially loading or when no properties and loading
  const isInitialLoading =
    (loading || searchLoading) && properties.length === 0;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              {searchTerm ? "Searching properties..." : "Loading properties..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Logo size="sm" />
              </Link>
            </div>
            <nav className="flex items-center">
              <Button
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Sign Up
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button and Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Link>

          <div className="rounded-2xl p-8 shadow-sm border border-gray-200 bg-gradient-to-r from-gray-900 to-gray-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Browse Properties
                </h1>
                <p className="text-white">
                  Explore our selection of properties - no account required
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by location, property type..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black"
              />
            </form>
          </div>
        </div>

        {/* Registration Prompt */}
        {showRegistrationPrompt && (
          <div className="mb-8 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center">
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 mr-3 sm:mr-4 flex-shrink-0 mt-1 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">
                    Want to see more properties?
                  </h3>
                  <p className="text-gray-200 text-sm sm:text-base">
                    Create a free account to access all {totalProperties}+
                    properties and save your favorites
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium whitespace-nowrap"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Failed to Load Properties
            </h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={() => handlePropertyClick(property)}
                />
              ))}
            </div>

            {/* Limited Access Notice */}
            {properties.length >= 6 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  You&apos;re viewing a limited selection
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Sign up for free to access all properties, save favorites, and
                  get personalized matches
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setAuthModalOpen(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Create Account
                  </Button>
                  <Button
                    onClick={() => setAuthModalOpen(true)}
                    variant="outline"
                  >
                    Take Lifestyle Quiz
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              No properties found
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Try adjusting your search terms to find more properties.
            </p>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
