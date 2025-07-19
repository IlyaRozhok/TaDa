"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PropertyFilters } from "../../lib/api";
import { Property } from "../../types";
import { useTranslations } from "../../lib/language-context";
import PropertyCard from "../../components/PropertyCard";
import DashboardHeader from "../../components/DashboardHeader";
import { useFilteredProperties } from "../../hooks/useProperties";
import { useDebounce } from "../../hooks/useDebounce";
import {
  Search,
  Filter,
  ArrowLeft,
  Home,
  Bed,
  PoundSterling,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function AllPropertiesPage() {
  const router = useRouter();
  const t = useTranslations();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<PropertyFilters>({
    min_price: undefined,
    max_price: undefined,
    bedrooms: undefined,
    property_type: undefined,
  });

  const [tempFilters, setTempFilters] = useState<PropertyFilters>({});

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("📡 Fetching all properties...");
        const response = await propertiesAPI.getAll();
        const responseData = response.data || response;
        
        // Backend returns { data: properties[], total, page, totalPages }
        const propertiesData = responseData.data || responseData.properties || responseData || [];

        setProperties(propertiesData);
        setFilteredProperties(propertiesData);
        console.log("✅ Properties loaded:", propertiesData.length);
      } catch (err: any) {
        console.error("❌ Error fetching properties:", err);
        setError("Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Apply search and filters
  useEffect(() => {
    // Early return if properties is not yet loaded or not an array
    if (!properties || !Array.isArray(properties)) {
      return;
    }
    
    let filtered = [...properties];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchLower) ||
          property.address.toLowerCase().includes(searchLower) ||
          property.property_type.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.min_price !== undefined && filters.min_price > 0) {
      filtered = filtered.filter(
        (property) => property.price >= filters.min_price!
      );
    }

    if (filters.max_price !== undefined && filters.max_price > 0) {
      filtered = filtered.filter(
        (property) => property.price <= filters.max_price!
      );
    }

    if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
      filtered = filtered.filter(
        (property) => property.bedrooms === filters.bedrooms
      );
    }

    if (filters.property_type && filters.property_type !== "all") {
      filtered = filtered.filter(
        (property) => property.property_type === filters.property_type
      );
    }

    setFilteredProperties(filtered);
  }, [properties, searchTerm, filters]);

  const handlePropertyClick = (property: Property) => {
    router.push(`/app/properties/${property.id}`);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      min_price: undefined,
      max_price: undefined,
      bedrooms: undefined,
      property_type: undefined,
    };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
    setShowFilters(false);
  };

  const getPropertyTypes = () => {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }
    const types = new Set(properties.map((p) => p.property_type));
    return Array.from(types);
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    if (filters.min_price) activeFilters.push(`Min £${filters.min_price}`);
    if (filters.max_price) activeFilters.push(`Max £${filters.max_price}`);
    if (filters.bedrooms)
      activeFilters.push(
        `${filters.bedrooms} bed${filters.bedrooms > 1 ? "s" : ""}`
      );
    if (filters.property_type && filters.property_type !== "all") {
      activeFilters.push(
        filters.property_type.charAt(0).toUpperCase() +
          filters.property_type.slice(1)
      );
    }
    return activeFilters;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading properties...</p>
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Failed to Load Properties
            </h3>
            <p className="text-red-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
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
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  All Properties
                </h1>
                <p className="text-slate-600">
                  Discover your perfect home from our curated collection
                </p>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search properties, locations, or types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
                {getFilterSummary().length > 0 && (
                  <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {getFilterSummary().length}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters */}
            {getFilterSummary().length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {getFilterSummary().map((filter, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
                  >
                    {filter}
                  </span>
                ))}
                <button
                  onClick={clearFilters}
                  className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
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
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              No properties found
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchTerm || getFilterSummary().length > 0
                ? "Try adjusting your search terms or filters to find more properties."
                : "There are currently no properties available."}
            </p>
            {(searchTerm || getFilterSummary().length > 0) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  clearFilters();
                }}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        )}

        {/* Results Summary */}
        {filteredProperties.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-slate-100 rounded-lg p-4 inline-block">
              <p className="text-slate-700 font-medium">
                Showing{" "}
                <span className="text-blue-600 font-bold">
                  {filteredProperties.length}
                </span>{" "}
                of{" "}
                <span className="text-slate-900 font-bold">
                  {properties.length}
                </span>{" "}
                properties
              </p>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-slate-100 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Property Search Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-slate-900 mb-2">Use Search</p>
              <p>
                Search by property title, address, or type to quickly find what
                you're looking for.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-slate-900 mb-2">Apply Filters</p>
              <p>
                Use price range, bedroom count, and property type filters to
                narrow down results.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-slate-900 mb-2">
                Save Favorites
              </p>
              <p>
                Click the heart icon on any property to add it to your shortlist
                for later viewing.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-slate-900 mb-2">View Details</p>
              <p>
                Click on any property card to view detailed information, photos,
                and features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
