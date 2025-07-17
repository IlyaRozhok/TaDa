"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { propertiesAPI } from "../lib/api";
import PropertyCard from "../components/PropertyCard";
import { Button } from "../components/ui/Button";
import Logo from "../components/Logo";
import { Search, Home, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Property } from "../types";

export default function PublicPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await propertiesAPI.getPublic(page, 6, searchTerm);

        setProperties(response.data || []);
        setTotalPages(response.totalPages || 1);
        setTotalProperties(response.total || 0);

        // Show registration prompt if user tries to go beyond first page
        if (page > 1 || (response.data && response.data.length >= 6)) {
          setShowRegistrationPrompt(true);
        }
      } catch (err: unknown) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page, searchTerm]);

  const handlePropertyClick = (property: Property) => {
    router.push(`/properties/${property.id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading properties...</p>
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
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  TaDa
                </span>
              </Link>
            </div>
            <nav className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Home
              </Link>
              <Link
                href="/app/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link href="/app/auth/register">
                <Button
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Sign Up
                </Button>
              </Link>
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

          <div className="bg-[#E5E4E2] rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Browse Properties
                </h1>
                <p className="text-gray-600">
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
          <div className="mb-8 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center">
              <Lock className="w-8 h-8 mr-4" />
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Want to see more properties?
                </h3>
                <p className="text-gray-200">
                  Create a free account to access all {totalProperties}+
                  properties and save your favorites
                </p>
              </div>
            </div>
            <Link href="/app/auth/register">
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                Sign Up Free
              </Button>
            </Link>
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
                  <Link href="/app/auth/register">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                      Create Account
                    </Button>
                  </Link>
                  <Link href="/app/preferences">
                    <Button variant="outline">Take Lifestyle Quiz</Button>
                  </Link>
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
    </div>
  );
}
