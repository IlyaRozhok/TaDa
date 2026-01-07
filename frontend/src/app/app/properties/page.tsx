"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PropertyFilters, SortOptions, PaginationOptions } from "../../lib/api";
import { Property } from "../../types";
import PropertyGridWithLoader from "../../components/PropertyGridWithLoader";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
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
  ChevronDown,
  SortAsc,
  SortDesc,
} from "lucide-react";

export default function AllPropertiesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term with 400ms to prevent cyclic requests
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Filter states - updated with all available filters
  const [filters, setFilters] = useState<PropertyFilters>({
    min_price: undefined,
    max_price: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    property_type: undefined,
    furnishing: undefined,
    tenant_types: undefined,
    amenities: undefined,
    min_square_meters: undefined,
    max_square_meters: undefined,
  });

  const [tempFilters, setTempFilters] = useState<PropertyFilters>({});

  // Sorting and pagination states
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: "date",
    sortDirection: "desc",
  });

  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions>(
    {
      page: 1,
      limit: 12,
    }
  );

  // Use filtered properties hook with all options
  const {
    properties,
    filteredProperties,
    paginatedProperties,
    paginationInfo,
    loading,
    error,
    fetchProperties,
  } = useFilteredProperties(
    filters,
    debouncedSearchTerm,
    sortOptions,
    paginationOptions
  );

  // Load properties on component mount
  useEffect(() => {
    console.log("📡 Loading properties...");
    fetchProperties();
  }, []); // Only load once on mount

  // Filtering is now handled automatically by the useFilteredProperties hook

  const handlePropertyClick = (property: Property) => {
    router.push(`/app/properties/${property.id}`);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setPaginationOptions((prev) => ({ ...prev, page: 1 })); // Reset to first page
    setShowFilters(false);
  };

  const clearFilters = () => {
    const emptyFilters: PropertyFilters = {
      min_price: undefined,
      max_price: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      property_type: undefined,
      furnishing: undefined,
      tenant_types: undefined,
      amenities: undefined,
      min_square_meters: undefined,
      max_square_meters: undefined,
    };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
    setPaginationOptions((prev) => ({ ...prev, page: 1 }));
    setShowFilters(false);
  };

  const handleSortChange = (sortBy: SortOptions["sortBy"]) => {
    setSortOptions((prev) => ({
      sortBy,
      sortDirection:
        prev.sortBy === sortBy && prev.sortDirection === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (page: number) => {
    setPaginationOptions((prev) => ({ ...prev, page }));
  };

  const getPropertyTypes = () => {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }
    const types = new Set(properties.map((p) => p.property_type));
    return Array.from(types);
  };

  const getFilterSummary = () => {
    const activeFilters: string[] = [];

    if (filters.min_price) activeFilters.push(`Min £${filters.min_price}`);
    if (filters.max_price) activeFilters.push(`Max £${filters.max_price}`);
    if (filters.bedrooms)
      activeFilters.push(
        `≥${filters.bedrooms} bed${filters.bedrooms > 1 ? "s" : ""}`
      );
    if (filters.bathrooms)
      activeFilters.push(
        `≥${filters.bathrooms} bath${filters.bathrooms > 1 ? "s" : ""}`
      );
    if (filters.property_type && filters.property_type !== "all") {
      activeFilters.push(
        filters.property_type.charAt(0).toUpperCase() +
          filters.property_type.slice(1)
      );
    }
    if (filters.furnishing && filters.furnishing !== "all") {
      activeFilters.push(`Furnished: ${filters.furnishing}`);
    }
    if (filters.tenant_types && filters.tenant_types.length > 0) {
      activeFilters.push(`Tenant types: ${filters.tenant_types.join(", ")}`);
    }
    if (filters.amenities && filters.amenities.length > 0) {
      activeFilters.push(`Amenities: ${filters.amenities.length}`);
    }
    if (filters.min_square_meters)
      activeFilters.push(`Min ${filters.min_square_meters} m²`);
    if (filters.max_square_meters)
      activeFilters.push(`Max ${filters.max_square_meters} m²`);

    return activeFilters;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TenantUniversalHeader
          showPreferencesButton={true}
        />
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div>
                  <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Grid Skeleton */}
          <PropertyGridWithLoader
            properties={[]}
            loading={true}
            skeletonCount={6}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TenantUniversalHeader
          showPreferencesButton={true}
        />
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
              onClick={() =>
                typeof window !== "undefined" && window.location.reload()
              }
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
      <TenantUniversalHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/app/units")}
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
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-500 transition-colors font-medium"
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

        {/* Sorting and Pagination Controls */}
        {!loading && filteredProperties.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                Sort by:
              </span>
              <select
                value={`${sortOptions.sortBy}-${sortOptions.sortDirection}`}
                onChange={(e) => {
                  const [sortBy, direction] = e.target.value.split("-") as [
                    SortOptions["sortBy"],
                    "asc" | "desc"
                  ];
                  setSortOptions({ sortBy, sortDirection: direction });
                }}
                className="px-3 py-1 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="bedrooms-asc">Bedrooms: Few to Many</option>
                <option value="bedrooms-desc">Bedrooms: Many to Few</option>
                <option value="square_meters-asc">Size: Small to Large</option>
                <option value="square_meters-desc">Size: Large to Small</option>
              </select>
            </div>

            {/* Results Summary */}
            <div className="bg-slate-100 rounded-lg p-3">
              <p className="text-slate-700 font-medium text-sm">
                Showing{" "}
                <span className="text-blue-600 font-bold">
                  {paginationInfo.total}
                </span>{" "}
                properties
                {paginationInfo.totalPages > 1 && (
                  <>
                    {" "}
                    (page {paginationInfo.page} of {paginationInfo.totalPages})
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        <PropertyGridWithLoader
          properties={paginatedProperties}
          loading={loading}
          onPropertyClick={handlePropertyClick}
        />

        {!loading && filteredProperties.length === 0 && (
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

        {/* Pagination Controls */}
        {!loading && paginationInfo.totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(paginationInfo.page - 1)}
                disabled={paginationInfo.page <= 1}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from(
                { length: Math.min(5, paginationInfo.totalPages) },
                (_, i) => {
                  const pageNum = Math.max(
                    1,
                    Math.min(
                      paginationInfo.page - 2 + i,
                      paginationInfo.totalPages - 4 + i
                    )
                  );

                  if (pageNum < 1 || pageNum > paginationInfo.totalPages)
                    return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-md text-sm ${
                        pageNum === paginationInfo.page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}

              <button
                onClick={() => handlePageChange(paginationInfo.page + 1)}
                disabled={paginationInfo.page >= paginationInfo.totalPages}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Filter Properties
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Min Price (£)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tempFilters.min_price || ""}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            min_price: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Max Price (£)
                      </label>
                      <input
                        type="number"
                        placeholder="No limit"
                        value={tempFilters.max_price || ""}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            max_price: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Bedrooms & Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Min Bedrooms
                      </label>
                      <select
                        value={tempFilters.bedrooms || ""}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            bedrooms: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Min Bathrooms
                      </label>
                      <select
                        value={tempFilters.bathrooms || ""}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            bathrooms: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Property Type
                    </label>
                    <select
                      value={tempFilters.property_type || ""}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          property_type: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      {getPropertyTypes().map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Furnishing */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Furnishing
                    </label>
                    <select
                      value={tempFilters.furnishing || ""}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          furnishing: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any</option>
                      <option value="furnished">Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                      <option value="partially">Partially Furnished</option>
                    </select>
                  </div>

                  {/* Square Meters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Min Size (m²)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tempFilters.min_square_meters || ""}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            min_square_meters: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Max Size (m²)
                      </label>
                      <input
                        type="number"
                        placeholder="No limit"
                        value={tempFilters.max_square_meters || ""}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            max_square_meters: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
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
                you&apos;re looking for.
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
