"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Map, ChevronLeft, ChevronRight } from "lucide-react";
import { Property } from "../types";
import { CategoryMatchResult } from "../lib/api";
import EnhancedPropertyCard from "./EnhancedPropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import styles from "./ui/DropdownStyles.module.scss";

interface MatchedProperty {
  property: Property;
  matchScore: number;
  categories?: CategoryMatchResult[];
}

interface ListedPropertiesSectionProps {
  properties: Property[];
  matchedProperties: MatchedProperty[];
  loading: boolean;
  userPreferences?: {
    min_price?: number;
    max_price?: number;
    min_bedrooms?: number;
    property_type?: string[];
    lifestyle_features?: string[];
    primary_postcode?: string;
  };
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex text-slate-900 items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">{currentLabel}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className={`absolute top-full left-0 ${styles.dropdownContainer}`}
          >
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`${styles.dropdownItem} ${
                  sortBy === option.value ? "bg-white/20" : ""
                }`}
              >
                <span className={styles.dropdownText}>{option.label}</span>
              </button>
            ))}
          </div>
          <div
            className={`fixed inset-0 ${styles.dropdownBackdrop}`}
            onClick={() => setIsOpen(false)}
          />
        </>
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

  // Combine and sort properties
  const getAllProperties = () => {
    // If we have matched properties, prioritize them
    // Otherwise, use regular properties and try to match them
    let allProps: Array<{
      property: Property;
      matchScore: number;
      categories?: CategoryMatchResult[];
    }> = [];

    if (matchedProperties.length > 0) {
      // Use matched properties as primary source
      allProps = matchedProperties.map((mp) => ({
        property: mp.property,
        matchScore: mp.matchScore || 0,
        categories: mp.categories,
      }));

      // Add any properties from regular API that aren't in matched list
      const matchedIds = new Set(matchedProperties.map((mp) => mp.property.id));
      const regularProperties = Array.isArray(properties) ? properties : [];

      regularProperties.forEach((property) => {
        if (!matchedIds.has(property.id)) {
          allProps.push({
            property,
            matchScore: 0, // No match data available
            categories: undefined,
          });
        }
      });
    } else {
      // Fallback: use regular properties if no matched properties available
      let actualProperties = properties;
      if (
        properties &&
        typeof properties === "object" &&
        !Array.isArray(properties) &&
        "data" in properties
      ) {
        const propertiesWithData = properties as { data: Property[] };
        if (Array.isArray(propertiesWithData.data)) {
          actualProperties = propertiesWithData.data;
        }
      }

      allProps = (Array.isArray(actualProperties) ? actualProperties : []).map(
        (property) => ({
          property,
          matchScore: 0,
          categories: undefined,
        })
      );
    }

    // Sort based on selected option
    return allProps.sort((a, b) => {
      switch (sortBy) {
        case "bestMatch":
          // Sort by match score (descending), then by date if scores are equal
          if (a.matchScore === b.matchScore) {
            return (
              new Date(b.property.created_at).getTime() -
              new Date(a.property.created_at).getTime()
            );
          }
          return b.matchScore - a.matchScore;
        case "lowPrice":
          return (a.property.price || 0) - (b.property.price || 0);
        case "highPrice":
          return (b.property.price || 0) - (a.property.price || 0);
        case "lowDeposit":
          return (a.property.deposit || 0) - (b.property.deposit || 0);
        case "highDeposit":
          return (b.property.deposit || 0) - (a.property.deposit || 0);
        case "dateAdded":
          return (
            new Date(b.property.created_at || 0).getTime() -
            new Date(a.property.created_at || 0).getTime()
          );
        default:
          return 0;
      }
    });
  };

  const sortedProperties = getAllProperties();

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/app/properties/${propertyId}`);
  };

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Listed property
          </h2>
          <p className="text-gray-600">
            After you log in, our service gives you the best results tailored to
            your preferences
            <span className="ml-4 text-gray-900 font-medium">
              • {totalCount} items
            </span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />

          <button
            onClick={() => router.push("/app/properties/map")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <Map className="w-4 h-4 text-slate-900" />
            <span className="font-medium text-slate-900">Show map</span>
          </button>
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
            {sortedProperties.map(({ property, matchScore, categories }) => (
              <EnhancedPropertyCard
                key={property.id}
                property={property}
                matchScore={matchScore || 0} // Use actual match score from API
                userPreferences={userPreferences}
                matchCategories={categories}
                onClick={() => handlePropertyClick(property.id)}
                showShortlist={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
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
        <div className="flex justify-center items-center mt-8 gap-2">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 1
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              currentPage === totalPages
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </section>
  );
}
