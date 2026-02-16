"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Property, Preferences } from "../types";
import EnhancedPropertyCard from "./EnhancedPropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";

interface ListedPropertiesSectionProps {
  properties: Array<{
    property: Property;
    matchScore?: number;
    categories?: Array<{
      category: string;
      match: boolean;
      score: number;
      maxScore: number;
      reason: string;
      details?: string;
      hasPreference: boolean;
    }>;
  }>;
  matchedProperties: Array<{
    property: Property;
    matchScore?: number;
    categories?: Array<{
      category: string;
      match: boolean;
      score: number;
      maxScore: number;
      reason: string;
      details?: string;
      hasPreference: boolean;
    }>;
  }>;
  loading: boolean;
  userPreferences?: Preferences;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

type SortOption =
  | "bestMatch"
  | "lowPrice"
  | "highPrice"
  | "lowDeposit"
  | "highDeposit"
  | "dateAdded";

interface SortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { value: "bestMatch" as const, label: "Best Match Score" },
    { value: "lowPrice" as const, label: "Low price" },
    { value: "highPrice" as const, label: "High Price" },
    { value: "lowDeposit" as const, label: "Low Deposit" },
    { value: "highDeposit" as const, label: "High Deposit" },
    { value: "dateAdded" as const, label: "Date Added" },
  ];

  const currentLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label ||
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
        className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        aria-label="Sort by"
      >
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 sm:mt-2 rounded-xl min-w-[200px] sm:min-w-[240px] z-50 overflow-hidden backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 100%), rgba(0, 0, 0, 0.65)",
            boxShadow:
              "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
          }}
        >
          <div className="max-h-64 overflow-y-auto rounded-xl relative">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full cursor-pointer px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg ${
                  sortBy === option.value
                    ? "bg-white/18 text-white font-semibold"
                    : "text-white hover:bg-white/12"
                }`}
                style={{
                  backdropFilter:
                    sortBy === option.value ? "blur(10px)" : undefined,
                  fontWeight: sortBy === option.value ? 600 : undefined,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListedPropertiesSection({
  properties,
  matchedProperties,
  loading,
  userPreferences,
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: ListedPropertiesSectionProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>("bestMatch");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        // Close any open dropdowns
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sort properties
  const sortedProperties = useMemo(() => {
    // Filter out any invalid properties (where property is undefined or null)
    const validProperties = properties.filter(
      (item) => item && item.property && item.property.id,
    );

    if (validProperties.length === 0) {
      return [];
    }

    switch (sortBy) {
      case "bestMatch":
        return validProperties.sort(
          (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
        );
      case "lowPrice":
        return validProperties.sort(
          (a, b) => (a.property.price || 0) - (b.property.price || 0),
        );
      case "highPrice":
        return validProperties.sort(
          (a, b) => (b.property.price || 0) - (a.property.price || 0),
        );
      case "lowDeposit":
        return validProperties.sort(
          (a, b) => (a.property.deposit || 0) - (b.property.deposit || 0),
        );
      case "highDeposit":
        return validProperties.sort(
          (a, b) => (b.property.deposit || 0) - (a.property.deposit || 0),
        );
      case "dateAdded":
        return validProperties.sort((a, b) => {
          const dateA = new Date(a.property.created_at || 0).getTime();
          const dateB = new Date(b.property.created_at || 0).getTime();
          return dateB - dateA;
        });
      default:
        return validProperties;
    }
  }, [properties, sortBy]);

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/app/properties/${propertyId}`);
  };

  return (
    <section>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Listed property
          </h2>
          <p className="text-gray-600">
            After you log in, our service gives you the best results tailored to
            your preferences
            <span className="ml-2 text-gray-900 font-medium">
              • {totalCount} items
            </span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="relative">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <PropertyCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : sortedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProperties
              .filter((item) => item && item.property && item.property.id)
              .map(({ property, matchScore, categories }) => (
                <EnhancedPropertyCard
                  key={property.id}
                  property={property}
                  matchScore={matchScore || 0}
                  userPreferences={userPreferences}
                  matchCategories={categories}
                  onClick={() => handlePropertyClick(property.id)}
                  showShortlist={true}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h5a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search terms or preferences to see more
                results
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
